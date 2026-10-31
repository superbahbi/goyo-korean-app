import { useState, useEffect, useCallback } from "react";
import { scheduleReview } from "@/lib/srs";
import { requestPersistentStorage } from "@/lib/storageProtection";
import {
  appendReviewEntry,
  createReviewLog,
  sanitizeReviewLog,
  type ReviewLog,
  type StudyMode,
} from "@/lib/reviewLog";
import { addDays, getLocalDateKey } from "@/lib/day";
import {
  deriveStreak,
  migrateLegacyDay,
  recordStudyDay,
  sanitizeStudyDays,
  type StudyDays,
} from "@/lib/studyDays";
import {
  getMasteryState,
  type CardState,
  type MasteryState,
} from "@/lib/mastery";

export { getLocalDateKey, getMasteryState };
export type { CardState, MasteryState };

export const SCHEMA_VERSION = 4;

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  lastStudyDate: string;
  highestStreak: number;
  totalCardsLearned: number;
}

export interface UserState {
  schemaVersion: number;
  cardStates: Record<string, CardState>;
  stats: UserStats;
  settings: {
    dailyGoal: number;
    newCardsPerDay: number;
    autoPlayAudio: boolean;
    audioSpeaker: "elevenlabs" | "elevenlabs-female";
  };
  reviewLog: ReviewLog;
  /** One entry per studied day, keyed by local `YYYY-MM-DD`. */
  studyDays: StudyDays;
}

export interface GradeOptions {
  countProgress?: boolean;
  responseTimeMs?: number;
  mode?: StudyMode;
  /** Shadowing is self-reported, so it is logged but never touches the schedule. */
  practiceOnly?: boolean;
}

const STORAGE_KEY = "goyo-progress-v2";

function createDefaultState(): UserState {
  return {
    schemaVersion: SCHEMA_VERSION,
    cardStates: {},
    stats: {
      totalXp: 0,
      level: 1,
      streak: 0,
      lastStudyDate: "",
      highestStreak: 0,
      totalCardsLearned: 0,
    },
    settings: {
      dailyGoal: 10,
      newCardsPerDay: 3,
      autoPlayAudio: true,
      audioSpeaker: "elevenlabs",
    },
    reviewLog: createReviewLog(),
    studyDays: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function sanitizeCardState(id: string, value: unknown): CardState | null {
  if (!isRecord(value)) return null;
  if (typeof value.due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.due))
    return null;

  const timesReviewed = nonNegativeNumber(value.timesReviewed, 0);
  const card: CardState = {
    id,
    due: value.due,
    interval: nonNegativeNumber(value.interval, 0),
    timesReviewed,
    timesCorrect: Math.min(
      timesReviewed,
      nonNegativeNumber(value.timesCorrect, 0)
    ),
    lastReviewDate:
      typeof value.lastReviewDate === "string" ? value.lastReviewDate : "",
  };

  const easeFactor = optionalNonNegativeNumber(value.easeFactor);
  const consecutiveCorrect = optionalNonNegativeNumber(
    value.consecutiveCorrect
  );
  const lapseCount = optionalNonNegativeNumber(value.lapseCount);
  const lastResponseTimeMs = optionalNonNegativeNumber(
    value.lastResponseTimeMs
  );
  if (easeFactor !== undefined) card.easeFactor = easeFactor;
  if (consecutiveCorrect !== undefined)
    card.consecutiveCorrect = consecutiveCorrect;
  if (lapseCount !== undefined) card.lapseCount = lapseCount;
  if (lastResponseTimeMs !== undefined)
    card.lastResponseTimeMs = lastResponseTimeMs;
  return card;
}

// A missing or older schemaVersion is treated as current. Pre-v2 saves are not migrated.
export function parseSavedState(
  raw: string | null,
  today = getLocalDateKey()
): UserState {
  const defaults = createDefaultState();

  try {
    if (!raw) return defaults;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaults;

    const cardStates: Record<string, CardState> = {};
    if (isRecord(parsed.cardStates)) {
      for (const [id, value] of Object.entries(parsed.cardStates)) {
        const card = sanitizeCardState(id, value);
        if (card) cardStates[id] = card;
      }
    }

    const savedStats = isRecord(parsed.stats) ? parsed.stats : {};
    const totalXp = nonNegativeNumber(savedStats.totalXp, 0);
    const lastStudyDate =
      typeof savedStats.lastStudyDate === "string"
        ? savedStats.lastStudyDate
        : "";
    // v3 and older kept only today's counter. Fold it into the first day entry.
    const studyDays = migrateLegacyDay(
      sanitizeStudyDays(parsed.studyDays),
      lastStudyDate,
      nonNegativeNumber(savedStats.cardsStudiedToday, 0)
    );
    const streak = deriveStreak(studyDays, today);
    const stats: UserStats = {
      totalXp,
      level: Math.max(
        1,
        nonNegativeNumber(
          savedStats.level,
          Math.floor(Math.sqrt(totalXp / 100)) + 1
        )
      ),
      streak,
      lastStudyDate,
      highestStreak: Math.max(
        streak,
        nonNegativeNumber(savedStats.highestStreak, 0)
      ),
      totalCardsLearned: nonNegativeNumber(savedStats.totalCardsLearned, 0),
    };

    const savedSettings = isRecord(parsed.settings) ? parsed.settings : {};
    const dailyGoal = nonNegativeNumber(
      savedSettings.dailyGoal,
      defaults.settings.dailyGoal
    );
    const newCardsPerDay = nonNegativeNumber(
      savedSettings.newCardsPerDay,
      defaults.settings.newCardsPerDay
    );
    const settings: UserState["settings"] = {
      dailyGoal: dailyGoal >= 1 ? dailyGoal : defaults.settings.dailyGoal,
      newCardsPerDay: Math.min(10, Math.max(1, Math.round(newCardsPerDay))),
      // `ttsEnabled` was a dead system-voice toggle; unknown keys in old saves are ignored.
      autoPlayAudio:
        typeof savedSettings.autoPlayAudio === "boolean"
          ? savedSettings.autoPlayAudio
          : defaults.settings.autoPlayAudio,
      // Older saved progress may contain a removed system-voice preference.
      audioSpeaker:
        savedSettings.audioSpeaker === "elevenlabs-female"
          ? "elevenlabs-female"
          : "elevenlabs",
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      cardStates,
      stats,
      settings,
      reviewLog: sanitizeReviewLog(parsed.reviewLog),
      studyDays,
    };
  } catch (error) {
    console.error("Failed to load saved progress, starting fresh:", error);
    return defaults;
  }
}

function loadState(): UserState {
  try {
    return parseSavedState(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    console.error("Failed to load saved progress, starting fresh:", error);
    return createDefaultState();
  }
}

export function buildExportPayload(
  state: UserState,
  exportedAt = new Date(),
  options: { includeReviewLog?: boolean } = {}
) {
  const payload = {
    schemaVersion: state.schemaVersion,
    exportedAt: exportedAt.toISOString(),
    cardStates: state.cardStates,
    stats: state.stats,
    settings: state.settings,
    studyDays: state.studyDays,
  };
  // The review log is for local analysis: it is large and not needed to restore
  // progress, so it only travels when the learner asks for it.
  return options.includeReviewLog
    ? { ...payload, reviewLog: state.reviewLog }
    : payload;
}

export type ImportValidation =
  | {
      ok: true;
      state: UserState;
      exportedAt: string | null;
      hasReviewLog: boolean;
    }
  | { ok: false; reason: string };

// Rejects anything that is not a complete progress save. Missing or unknown
// top-level keys beyond the required ones are ignored, and parseSavedState
// decides how each saved field is sanitized.
export function validateImportPayload(raw: string): ImportValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "The file is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      reason: "The file does not contain a progress object.",
    };
  }

  if (parsed.schemaVersion !== undefined) {
    if (
      typeof parsed.schemaVersion !== "number" ||
      !Number.isInteger(parsed.schemaVersion) ||
      parsed.schemaVersion < 1
    ) {
      return {
        ok: false,
        reason: "The schemaVersion field is not a valid version number.",
      };
    }
    if (parsed.schemaVersion > SCHEMA_VERSION) {
      return {
        ok: false,
        reason: `This file came from a newer version of Goyo (save format ${parsed.schemaVersion}; this app supports up to ${SCHEMA_VERSION}). Update the app before importing it.`,
      };
    }
  }

  const missing = (["cardStates", "stats", "settings"] as const).filter(
    key => !isRecord(parsed[key])
  );
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `The file is missing ${missing.join(", ")} (each must be an object).`,
    };
  }

  const exportedAt =
    typeof parsed.exportedAt === "string" &&
    !Number.isNaN(Date.parse(parsed.exportedAt))
      ? parsed.exportedAt
      : null;
  const hasReviewLog =
    isRecord(parsed.reviewLog) && Array.isArray(parsed.reviewLog.entries);

  return { ok: true, state: parseSavedState(raw), exportedAt, hasReviewLog };
}

/**
 * Apply one grade to saved progress. Pure, so the review log and the schedule
 * can be tested without React or localStorage; `now` is injectable for tests.
 */
export function applyGrade(
  state: UserState,
  cardId: string,
  rating: "again" | "good" | "easy",
  options: GradeOptions = {},
  now = new Date()
): UserState {
  const requestedProgress = options.countProgress !== false;
  const today = getLocalDateKey(now);
  const logEntry = {
    cardId,
    at: now.toISOString(),
    rating,
    responseTimeMs:
      typeof options.responseTimeMs === "number"
        ? options.responseTimeMs
        : null,
    mode: options.mode ?? "daily",
  } as const;

  // Self-reported practice still belongs in the log, but it must not move the
  // schedule, earn XP, or count toward the daily goal.
  if (options.practiceOnly) {
    return {
      ...state,
      reviewLog: appendReviewEntry(state.reviewLog, logEntry),
    };
  }

  const existingCard = state.cardStates[cardId];
  const recognition =
    options.mode === "listening" || options.mode === "scenario";
  const { schedule, advanced } = scheduleReview(
    existingCard,
    rating,
    today,
    options.responseTimeMs,
    {
      recognition,
    }
  );
  // Re-grading a card already reviewed today earns no progress or XP.
  const countProgress = requestedProgress && advanced;
  const xpGain = countProgress
    ? rating === "easy"
      ? 15
      : rating === "good"
        ? 10
        : 5
    : 0;

  const studyDays = recordStudyDay(state.studyDays, today, {
    cardFirstSeenToday: existingCard?.lastReviewDate !== today,
    scheduleAdvanced: advanced,
  });
  const newStreak = deriveStreak(studyDays, today);
  const newHighestStreak = Math.max(state.stats.highestStreak, newStreak);

  const responseTimeMs = options.responseTimeMs;
  const newCardState: CardState = {
    id: cardId,
    due:
      advanced || !existingCard
        ? addDays(today, schedule.interval)
        : existingCard.due,
    interval: schedule.interval,
    timesReviewed: (existingCard?.timesReviewed || 0) + (advanced ? 1 : 0),
    timesCorrect:
      (existingCard?.timesCorrect || 0) +
      (advanced && rating !== "again" ? 1 : 0),
    lastReviewDate: today,
    easeFactor: schedule.easeFactor,
    consecutiveCorrect: schedule.consecutiveCorrect,
    lapseCount: schedule.lapseCount,
    lastResponseTimeMs:
      typeof responseTimeMs === "number"
        ? responseTimeMs
        : existingCard?.lastResponseTimeMs,
  };

  return {
    ...state,
    cardStates: {
      ...state.cardStates,
      [cardId]: newCardState,
    },
    stats: {
      totalXp: state.stats.totalXp + xpGain,
      level: Math.floor(Math.sqrt((state.stats.totalXp + xpGain) / 100)) + 1,
      lastStudyDate: today,
      streak: newStreak,
      highestStreak: newHighestStreak,
      totalCardsLearned:
        advanced &&
        rating !== "again" &&
        (existingCard?.timesCorrect ?? 0) === 0
          ? state.stats.totalCardsLearned + 1
          : state.stats.totalCardsLearned,
    },
    studyDays,
    // Every grade is logged, including a same-day repeat. The scheduler still
    // owns whether the schedule moves; the log records what the learner did.
    reviewLog: appendReviewEntry(state.reviewLog, logEntry),
  };
}

export function useStudyState() {
  // Read the save during the first render so the dashboard never flashes blank
  // while an effect catches up.
  const [state, setState] = useState<UserState>(loadState);

  // Another tab wrote progress: adopt it instead of overwriting it later.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(
        event.newValue ? parseSavedState(event.newValue) : createDefaultState()
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [state]);

  const gradeCard = useCallback(
    (
      cardId: string,
      rating: "again" | "good" | "easy",
      options?: GradeOptions
    ) => {
      // Persist storage is granted per origin and cannot be requested repeatedly
      // for effect; ask on the first real use, not on first paint.
      void requestPersistentStorage();

      setState(current => applyGrade(current, cardId, rating, options));
    },
    []
  );

  const updateSettings = useCallback(
    (settings: Partial<UserState["settings"]>) => {
      setState(current => ({
        ...current,
        settings: { ...current.settings, ...settings },
      }));
    },
    []
  );

  const replaceState = useCallback((next: UserState) => {
    setState(next);
  }, []);

  return { state, gradeCard, updateSettings, replaceState };
}

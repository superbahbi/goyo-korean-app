import { getLocalDateKey } from "@/lib/day";
import {
  emptyGrammarProgress,
  sanitizeGrammarProgress,
  type GrammarProgress,
} from "@/lib/grammarProgress";
import type { CardState } from "@/lib/mastery";
import {
  createReviewLog,
  sanitizeReviewLog,
  type ReviewLog,
} from "@/lib/reviewLog";
import {
  deriveStreak,
  migrateLegacyDay,
  sanitizeStudyDays,
  type StudyDays,
} from "@/lib/studyDays";
import { FEMALE_VOICE_ENABLED } from "@/lib/voiceAvailability";
import { levelFromXp } from "@/lib/xp";

/**
 * Saved progress: the one format the app writes to localStorage, exports to a
 * file, and imports back. Parsing, sanitizing and validation live here so a
 * save is read the same way by the app and by import, and so the write path
 * can be tested without React or a browser.
 *
 * Callers hand in raw strings; this module never touches storage itself.
 */

export const SCHEMA_VERSION = 5;

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  lastStudyDate: string;
  highestStreak: number;
  totalCardsLearned: number;
}

export interface UserSettings {
  dailyGoal: number;
  newCardsPerDay: number;
  autoPlayAudio: boolean;
  audioSpeaker: "elevenlabs" | "elevenlabs-female";
}

export interface UserState {
  schemaVersion: number;
  cardStates: Record<string, CardState>;
  stats: UserStats;
  settings: UserSettings;
  reviewLog: ReviewLog;
  /** One entry per studied day, keyed by local `YYYY-MM-DD`. */
  studyDays: StudyDays;
  /** Lesson completion and best quiz scores. Travels with the export. */
  grammar: GrammarProgress;
}

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
    grammar: emptyGrammarProgress(),
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

/**
 * Reads only the save format version from a raw localStorage value. Anything
 * unreadable or malformed reports null, so callers can treat it like an
 * unversioned save instead of trusting it.
 */
export function getSavedSchemaVersion(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const version = parsed.schemaVersion;
    return typeof version === "number" &&
      Number.isInteger(version) &&
      version >= 1
      ? version
      : null;
  } catch {
    return null;
  }
}

/** True when a raw save was written by a newer app build than this one. */
export function isNewerSave(raw: string | null): boolean {
  const version = getSavedSchemaVersion(raw);
  return version !== null && version > SCHEMA_VERSION;
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
      // Derived exactly like applyGrade so an edited save cannot inflate a level.
      level: levelFromXp(totalXp),
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
    const settings: UserSettings = {
      dailyGoal: Math.min(100, Math.max(1, Math.round(dailyGoal))),
      newCardsPerDay: Math.min(10, Math.max(1, Math.round(newCardsPerDay))),
      // `ttsEnabled` was a dead system-voice toggle; unknown keys in old saves are ignored.
      autoPlayAudio:
        typeof savedSettings.autoPlayAudio === "boolean"
          ? savedSettings.autoPlayAudio
          : defaults.settings.autoPlayAudio,
      // Older saved progress may contain a removed system-voice preference.
      // The female voice is paused for now, so a save that selected it falls
      // back to the male voice instead of keeping an unusable preference.
      audioSpeaker:
        FEMALE_VOICE_ENABLED &&
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
      grammar: sanitizeGrammarProgress(parsed.grammar),
    };
  } catch (error) {
    console.error("Failed to load saved progress, starting fresh:", error);
    return defaults;
  }
}

export interface LoadedSave {
  state: UserState;
  /** A newer build owns the stored save, so this tab must not write over it. */
  blockedByNewerVersion: boolean;
}

/**
 * Turns the raw stored value into the state the app runs on. A newer save is
 * never parsed or rewritten: the caller keeps working in memory and the stored
 * save is left for the build that wrote it.
 */
export function loadSavedState(raw: string | null): LoadedSave {
  if (isNewerSave(raw)) {
    return { state: createDefaultState(), blockedByNewerVersion: true };
  }
  return { state: parseSavedState(raw), blockedByNewerVersion: false };
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
    grammar: state.grammar,
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
// decides how each saved field is sanitized. `today` is injectable so the
// derived streak can be tested without depending on the wall clock.
export function validateImportPayload(
  raw: string,
  today = getLocalDateKey()
): ImportValidation {
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

  return {
    ok: true,
    state: parseSavedState(raw, today),
    exportedAt,
    hasReviewLog,
  };
}

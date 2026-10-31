import { useState, useEffect, useCallback } from "react";
import { scheduleReview } from "@/lib/srs";

export const SCHEMA_VERSION = 2;

export interface CardState {
  id: string;
  due: string;
  interval: number;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewDate: string;
  easeFactor?: number;
  consecutiveCorrect?: number;
  lapseCount?: number;
  lastResponseTimeMs?: number;
}

export type MasteryState = "new" | "learning" | "shaky" | "known";

export function getMasteryState(cardState?: CardState): MasteryState {
  if (!cardState || cardState.timesReviewed === 0) return "new";
  const accuracy = cardState.timesCorrect / cardState.timesReviewed;
  const consecutiveCorrect = cardState.consecutiveCorrect ?? Math.min(2, cardState.timesCorrect);
  if (cardState.timesReviewed < 2 || accuracy < 0.5) return "learning";
  if (cardState.timesReviewed < 3 || accuracy < 0.75 || cardState.interval < 7 || consecutiveCorrect < 2) return "shaky";
  return "known";
}

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  lastStudyDate: string;
  highestStreak: number;
  cardsStudiedToday: number;
  totalCardsLearned: number;
}

export interface UserState {
  schemaVersion: number;
  cardStates: Record<string, CardState>;
  stats: UserStats;
  settings: {
    dailyGoal: number;
    ttsEnabled: boolean;
    autoPlayAudio: boolean;
    audioSpeaker: "elevenlabs" | "elevenlabs-female";
  };
}

const STORAGE_KEY = "goyo-progress-v2";

function addDays(date: string, days: number): string {
  const nextDate = new Date(`${date}T12:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
      cardsStudiedToday: 0,
      totalCardsLearned: 0,
    },
    settings: {
      dailyGoal: 10,
      ttsEnabled: true,
      autoPlayAudio: true,
      audioSpeaker: "elevenlabs",
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function sanitizeCardState(id: string, value: unknown): CardState | null {
  if (!isRecord(value)) return null;
  if (typeof value.due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.due)) return null;

  const timesReviewed = nonNegativeNumber(value.timesReviewed, 0);
  const card: CardState = {
    id,
    due: value.due,
    interval: nonNegativeNumber(value.interval, 0),
    timesReviewed,
    timesCorrect: Math.min(timesReviewed, nonNegativeNumber(value.timesCorrect, 0)),
    lastReviewDate: typeof value.lastReviewDate === "string" ? value.lastReviewDate : "",
  };

  const easeFactor = optionalNonNegativeNumber(value.easeFactor);
  const consecutiveCorrect = optionalNonNegativeNumber(value.consecutiveCorrect);
  const lapseCount = optionalNonNegativeNumber(value.lapseCount);
  const lastResponseTimeMs = optionalNonNegativeNumber(value.lastResponseTimeMs);
  if (easeFactor !== undefined) card.easeFactor = easeFactor;
  if (consecutiveCorrect !== undefined) card.consecutiveCorrect = consecutiveCorrect;
  if (lapseCount !== undefined) card.lapseCount = lapseCount;
  if (lastResponseTimeMs !== undefined) card.lastResponseTimeMs = lastResponseTimeMs;
  return card;
}

// A missing or older schemaVersion is treated as current. Pre-v2 saves are not migrated.
export function parseSavedState(raw: string | null): UserState {
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
    const streak = nonNegativeNumber(savedStats.streak, 0);
    const stats: UserStats = {
      totalXp,
      level: Math.max(1, nonNegativeNumber(savedStats.level, Math.floor(Math.sqrt(totalXp / 100)) + 1)),
      streak,
      lastStudyDate: typeof savedStats.lastStudyDate === "string" ? savedStats.lastStudyDate : "",
      highestStreak: Math.max(streak, nonNegativeNumber(savedStats.highestStreak, 0)),
      cardsStudiedToday: nonNegativeNumber(savedStats.cardsStudiedToday, 0),
      totalCardsLearned: nonNegativeNumber(savedStats.totalCardsLearned, 0),
    };

    const savedSettings = isRecord(parsed.settings) ? parsed.settings : {};
    const dailyGoal = nonNegativeNumber(savedSettings.dailyGoal, defaults.settings.dailyGoal);
    const settings: UserState["settings"] = {
      dailyGoal: dailyGoal >= 1 ? dailyGoal : defaults.settings.dailyGoal,
      ttsEnabled: typeof savedSettings.ttsEnabled === "boolean" ? savedSettings.ttsEnabled : defaults.settings.ttsEnabled,
      autoPlayAudio: typeof savedSettings.autoPlayAudio === "boolean" ? savedSettings.autoPlayAudio : defaults.settings.autoPlayAudio,
      // Older saved progress may contain a removed system-voice preference.
      audioSpeaker: savedSettings.audioSpeaker === "elevenlabs-female" ? "elevenlabs-female" : "elevenlabs",
    };

    return { schemaVersion: SCHEMA_VERSION, cardStates, stats, settings };
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

function resetDailyCountIfNewDay(state: UserState): UserState {
  if (state.stats.lastStudyDate === getLocalDateKey()) return state;
  return { ...state, stats: { ...state.stats, cardsStudiedToday: 0 } };
}

export function buildExportPayload(state: UserState, exportedAt = new Date()) {
  return {
    schemaVersion: state.schemaVersion,
    exportedAt: exportedAt.toISOString(),
    cardStates: state.cardStates,
    stats: state.stats,
    settings: state.settings,
  };
}

export type ImportValidation =
  | { ok: true; state: UserState; exportedAt: string | null }
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
    return { ok: false, reason: "The file does not contain a progress object." };
  }

  if (parsed.schemaVersion !== undefined) {
    if (typeof parsed.schemaVersion !== "number" || !Number.isInteger(parsed.schemaVersion) || parsed.schemaVersion < 1) {
      return { ok: false, reason: "The schemaVersion field is not a valid version number." };
    }
    if (parsed.schemaVersion > SCHEMA_VERSION) {
      return {
        ok: false,
        reason: `This file came from a newer version of Goyo (save format ${parsed.schemaVersion}; this app supports up to ${SCHEMA_VERSION}). Update the app before importing it.`,
      };
    }
  }

  const missing = (["cardStates", "stats", "settings"] as const).filter((key) => !isRecord(parsed[key]));
  if (missing.length > 0) {
    return { ok: false, reason: `The file is missing ${missing.join(", ")} (each must be an object).` };
  }

  const exportedAt =
    typeof parsed.exportedAt === "string" && !Number.isNaN(Date.parse(parsed.exportedAt)) ? parsed.exportedAt : null;

  return { ok: true, state: parseSavedState(raw), exportedAt };
}

export function useStudyState() {
  const [state, setState] = useState<UserState | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    setState(resetDailyCountIfNewDay(loadState()));
  }, []);

  // Another tab wrote progress: adopt it instead of overwriting it later.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(event.newValue ? parseSavedState(event.newValue) : createDefaultState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    }
  }, [state]);

  const gradeCard = useCallback(
    (cardId: string, rating: "again" | "good" | "easy", options?: { countProgress?: boolean; responseTimeMs?: number }) => {
      if (!state) return;

      const requestedProgress = options?.countProgress !== false;
      const today = getLocalDateKey();
      const yesterday = addDays(today, -1);

      const existingCard = state.cardStates[cardId];
      const { schedule, advanced } = scheduleReview(existingCard, rating, today, options?.responseTimeMs);
      // Re-grading a card already reviewed today earns no progress or XP.
      const countProgress = requestedProgress && advanced;
      const xpGain = countProgress ? (rating === "easy" ? 15 : rating === "good" ? 10 : 5) : 0;

      // Determine streak
      const lastDate = state.stats.lastStudyDate;
      let newStreak = state.stats.streak;

      if (!countProgress) {
        newStreak = state.stats.streak;
      } else if (lastDate === today) {
        newStreak = state.stats.streak;
      } else if (lastDate === yesterday) {
        newStreak = state.stats.streak + 1;
      } else {
        newStreak = 1;
      }

      const newHighestStreak = Math.max(
        state.stats.highestStreak,
        newStreak
      );

      const cardsStudiedToday = lastDate === today ? state.stats.cardsStudiedToday : 0;
      const responseTimeMs = options?.responseTimeMs;
      const newCardState: CardState = {
        id: cardId,
        due: advanced || !existingCard ? addDays(today, schedule.interval) : existingCard.due,
        interval: schedule.interval,
        timesReviewed: (existingCard?.timesReviewed || 0) + (advanced ? 1 : 0),
        timesCorrect:
          (existingCard?.timesCorrect || 0) + (advanced && rating !== "again" ? 1 : 0),
        lastReviewDate: today,
        easeFactor: schedule.easeFactor,
        consecutiveCorrect: schedule.consecutiveCorrect,
        lapseCount: schedule.lapseCount,
        lastResponseTimeMs: typeof responseTimeMs === "number" ? responseTimeMs : existingCard?.lastResponseTimeMs,
      };

      const isNewCard = !existingCard;

      const newState: UserState = {
        ...state,
        cardStates: {
          ...state.cardStates,
          [cardId]: newCardState,
        },
        stats: {
          totalXp: state.stats.totalXp + xpGain,
          level: Math.floor(
            Math.sqrt((state.stats.totalXp + xpGain) / 100)
          ) + 1,
          lastStudyDate: countProgress ? today : state.stats.lastStudyDate,
          streak: newStreak,
          highestStreak: newHighestStreak,
          cardsStudiedToday: countProgress ? cardsStudiedToday + 1 : cardsStudiedToday,
          totalCardsLearned: countProgress && isNewCard && rating !== "again"
            ? state.stats.totalCardsLearned + 1
            : state.stats.totalCardsLearned,
        },
      };

      setState(newState);
    },
    [state]
  );

  const updateSettings = useCallback(
    (settings: Partial<UserState["settings"]>) => {
      if (!state) return;
      setState({
        ...state,
        settings: { ...state.settings, ...settings },
      });
    },
    [state]
  );

  const replaceState = useCallback((next: UserState) => {
    setState(resetDailyCountIfNewDay(next));
  }, []);

  return { state, gradeCard, updateSettings, replaceState };
}

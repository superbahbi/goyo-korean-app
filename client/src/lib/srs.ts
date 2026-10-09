export type SrsRating = "again" | "good" | "easy";

export interface SrsCardState {
  interval?: number;
  timesReviewed?: number;
  timesCorrect?: number;
  easeFactor?: number;
  consecutiveCorrect?: number;
  lapseCount?: number;
}

export interface SrsSchedule {
  interval: number;
  box: number;
  easeFactor: number;
  consecutiveCorrect: number;
  lapseCount: number;
}

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.35;
const MAX_EASE = 3.2;
const MAX_INTERVAL = 365;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundInterval(days: number) {
  return clamp(Math.round(days), 1, MAX_INTERVAL);
}

/**
 * Schedule a card from the learner's recall rating.
 *
 * The model is intentionally conservative:
 * - Again is a lapse and returns the card tomorrow.
 * - Good grows with the card's current stability and ease factor.
 * - Easy grows faster, but only after the learner has demonstrated recall.
 * - Repeated lapses reduce ease and prevent runaway intervals.
 */
export function scheduleRecall(
  existing: SrsCardState | undefined,
  rating: SrsRating,
): SrsSchedule {
  const previousInterval = Math.max(0, existing?.interval ?? 0);
  const previousEase = clamp(existing?.easeFactor ?? DEFAULT_EASE, MIN_EASE, MAX_EASE);
  const previousCorrectStreak = Math.max(0, existing?.consecutiveCorrect ?? 0);
  const previousLapses = Math.max(0, existing?.lapseCount ?? 0);
  const isFirstReview = !existing || (existing.timesReviewed ?? 0) === 0;

  if (rating === "again") {
    return {
      interval: 1,
      box: 0,
      easeFactor: clamp(previousEase - 0.2, MIN_EASE, MAX_EASE),
      consecutiveCorrect: 0,
      lapseCount: previousLapses + 1,
    };
  }

  const nextEase = clamp(
    previousEase + (rating === "easy" ? 0.15 : 0),
    MIN_EASE,
    MAX_EASE,
  );
  const nextCorrectStreak = previousCorrectStreak + 1;

  if (isFirstReview) {
    return {
      interval: rating === "easy" ? 4 : 2,
      box: rating === "easy" ? 2 : 1,
      easeFactor: nextEase,
      consecutiveCorrect: nextCorrectStreak,
      lapseCount: previousLapses,
    };
  }

  if (previousLapses > 0 && previousCorrectStreak === 0) {
    return {
      interval: rating === "easy" ? 4 : 2,
      box: rating === "easy" ? 2 : 1,
      easeFactor: nextEase,
      consecutiveCorrect: nextCorrectStreak,
      lapseCount: previousLapses,
    };
  }

  const qualityMultiplier = rating === "easy" ? 1.3 : 1;
  const interval = roundInterval(
    Math.max(2, previousInterval || 1) * nextEase * qualityMultiplier,
  );

  return {
    interval,
    box: rating === "easy" ? 2 : 1,
    easeFactor: nextEase,
    consecutiveCorrect: nextCorrectStreak,
    lapseCount: previousLapses,
  };
}

export function getRecallAccuracy(state?: SrsCardState) {
  if (!state?.timesReviewed) return 0;
  return Math.round(((state.timesCorrect ?? 0) / state.timesReviewed) * 100);
}

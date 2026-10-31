export type SrsRating = "again" | "good" | "easy";

export interface SrsCardState {
  lastReviewDate?: string;
  interval?: number;
  timesReviewed?: number;
  timesCorrect?: number;
  easeFactor?: number;
  consecutiveCorrect?: number;
  lapseCount?: number;
  lastResponseTimeMs?: number;
}

export interface SrsSchedule {
  interval: number;
  easeFactor: number;
  consecutiveCorrect: number;
  lapseCount: number;
}

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.35;
const MAX_EASE = 3.2;
// Temporary 90-day cap. Revisit after 30 days of real data.
const TEMPORARY_MAX_INTERVAL_DAYS = 90;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundInterval(days: number) {
  return clamp(Math.round(days), 1, TEMPORARY_MAX_INTERVAL_DAYS);
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
  responseTimeMs?: number,
): SrsSchedule {
  const previousInterval = Math.max(0, existing?.interval ?? 0);
  const previousEase = clamp(existing?.easeFactor ?? DEFAULT_EASE, MIN_EASE, MAX_EASE);
  const previousCorrectStreak = Math.max(0, existing?.consecutiveCorrect ?? 0);
  const previousLapses = Math.max(0, existing?.lapseCount ?? 0);
  const responseWasSlow = typeof responseTimeMs === "number" && responseTimeMs > 12000;
  // A card with an interval but no review count (older saves) is not brand new.
  const isFirstReview = !existing || ((existing.timesReviewed ?? 0) === 0 && previousInterval === 0);
  const neverRecalled = (existing?.timesReviewed ?? 0) > 0 && (existing?.timesCorrect ?? 0) === 0;

  if (rating === "again") {
    // Failing a never-seen card is not a lapse: there was nothing to forget yet.
    if (isFirstReview) {
      return {
        interval: 1,
        easeFactor: previousEase,
        consecutiveCorrect: 0,
        lapseCount: previousLapses,
      };
    }
    return {
      interval: 1,
      easeFactor: clamp(previousEase - 0.2, MIN_EASE, MAX_EASE),
      consecutiveCorrect: 0,
      lapseCount: previousLapses + 1,
    };
  }

  const nextEase = clamp(
    previousEase + (rating === "easy" ? 0.15 : 0) - (responseWasSlow ? 0.1 : 0),
    MIN_EASE,
    MAX_EASE,
  );
  const nextCorrectStreak = previousCorrectStreak + 1;

  if (isFirstReview) {
    return {
      interval: rating === "easy" ? 4 : 2,
      easeFactor: nextEase,
      consecutiveCorrect: nextCorrectStreak,
      lapseCount: previousLapses,
    };
  }

  if ((previousLapses > 0 || neverRecalled) && previousCorrectStreak === 0) {
    return {
      interval: rating === "easy" ? 4 : 2,
      easeFactor: nextEase,
      consecutiveCorrect: nextCorrectStreak,
      lapseCount: previousLapses,
    };
  }

  const qualityMultiplier = rating === "easy" ? (responseWasSlow ? 1.1 : 1.3) : responseWasSlow ? 0.9 : 1;
  const interval = roundInterval(
    Math.max(2, previousInterval || 1) * nextEase * qualityMultiplier,
  );

  return {
    interval,
    easeFactor: nextEase,
    consecutiveCorrect: nextCorrectStreak,
    lapseCount: previousLapses,
  };
}

export interface SrsReviewResult {
  schedule: SrsSchedule;
  // False when a same-day repeat left the schedule (and review counters) untouched.
  advanced: boolean;
}

/**
 * Schedule a review while protecting against same-day repeats. Re-grading a card
 * that was already reviewed today must not compound its interval, so only a
 * fresh lapse ("again") is allowed to change the schedule on the same day.
 */
export function scheduleReview(
  existing: SrsCardState | undefined,
  rating: SrsRating,
  today: string,
  responseTimeMs?: number,
): SrsReviewResult {
  if (!existing || existing.lastReviewDate !== today) {
    return { schedule: scheduleRecall(existing, rating, responseTimeMs), advanced: true };
  }

  const alreadyDueTomorrow = (existing.interval ?? 0) <= 1;
  if (rating === "again" && !alreadyDueTomorrow) {
    return { schedule: scheduleRecall(existing, rating, responseTimeMs), advanced: true };
  }

  return {
    schedule: {
      interval: existing.interval ?? 0,
      easeFactor: clamp(existing.easeFactor ?? DEFAULT_EASE, MIN_EASE, MAX_EASE),
      consecutiveCorrect: existing.consecutiveCorrect ?? 0,
      lapseCount: existing.lapseCount ?? 0,
    },
    advanced: false,
  };
}

export function getRecallAccuracy(state?: SrsCardState) {
  if (!state?.timesReviewed) return 0;
  return Math.round(((state.timesCorrect ?? 0) / state.timesReviewed) * 100);
}

import { addDays } from "@/lib/day";

export interface StudyDay {
  /** Distinct cards graded that day. */
  cards: number;
  /** Graded reviews that moved the schedule. */
  reviews: number;
}

export type StudyDays = Record<string, StudyDay>;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export interface StudyDayEvent {
  /** The first grade for this card today. */
  cardFirstSeenToday: boolean;
  /** The scheduler accepted the grade (a same-day repeat does not count). */
  scheduleAdvanced: boolean;
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : 0;
}

/** Add one grade to the day's history, leaving an untouched day absent. */
export function recordStudyDay(
  days: StudyDays,
  today: string,
  event: StudyDayEvent
): StudyDays {
  if (!event.cardFirstSeenToday && !event.scheduleAdvanced) return days;
  const existing = days[today] ?? { cards: 0, reviews: 0 };
  return {
    ...days,
    [today]: {
      cards: existing.cards + (event.cardFirstSeenToday ? 1 : 0),
      reviews: existing.reviews + (event.scheduleAdvanced ? 1 : 0),
    },
  };
}

/** Accept only valid day keys and counts; cards can never exceed reviews. */
export function sanitizeStudyDays(value: unknown): StudyDays {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return {};
  const days: StudyDays = {};
  for (const [key, raw] of Object.entries(value)) {
    if (
      !DAY_KEY.test(key) ||
      typeof raw !== "object" ||
      raw === null ||
      Array.isArray(raw)
    )
      continue;
    const record = raw as Record<string, unknown>;
    const reviews = nonNegativeInteger(record.reviews);
    const cards = Math.min(nonNegativeInteger(record.cards), reviews);
    if (reviews === 0) continue;
    days[key] = { cards, reviews };
  }
  return days;
}

/**
 * Consecutive studied days ending today, or ending yesterday when today has not
 * been studied yet, so an in-progress streak is not shown as broken.
 */
export function deriveStreak(days: StudyDays, today: string): number {
  let cursor = days[today] ? today : addDays(today, -1);
  let streak = 0;
  while (days[cursor]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Days studied in the inclusive window ending today. */
export function daysStudiedWithin(
  days: StudyDays,
  today: string,
  windowDays: number
): number {
  let count = 0;
  for (let offset = 0; offset < windowDays; offset += 1) {
    if (days[addDays(today, -offset)]) count += 1;
  }
  return count;
}

/** Reviews logged in the inclusive window ending today. */
export function reviewsWithin(
  days: StudyDays,
  today: string,
  windowDays: number
): number {
  let count = 0;
  for (let offset = 0; offset < windowDays; offset += 1) {
    count += days[addDays(today, -offset)]?.reviews ?? 0;
  }
  return count;
}

/** Fold a v3 `cardsStudiedToday` counter into the history on first load. */
export function migrateLegacyDay(
  days: StudyDays,
  lastStudyDate: string,
  cardsStudiedToday: number
): StudyDays {
  if (Object.keys(days).length > 0) return days;
  if (!DAY_KEY.test(lastStudyDate) || cardsStudiedToday < 1) return days;
  const count = Math.floor(cardsStudiedToday);
  return { [lastStudyDate]: { cards: count, reviews: count } };
}

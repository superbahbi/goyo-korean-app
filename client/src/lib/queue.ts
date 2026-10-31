import { addDays } from "@/lib/day";
import { getMasteryState, type CardState } from "@/lib/mastery";
import { CATEGORIES, type VocabularyCard } from "@/lib/vocabulary";

export type CardStates = Record<string, CardState>;

export const DEFAULT_NEW_CARDS_PER_DAY = 3;

// Curated categories are ordered the way a beginner should meet them. Cards
// without a themed tag (the imported deck) come after every themed card.
const THEME_ORDER = new Map(CATEGORIES.map((category, index) => [category.id, index]));

function orderNewCardsByTheme(cards: VocabularyCard[]): VocabularyCard[] {
  return [...cards].sort((a, b) => {
    const aRank = THEME_ORDER.get(a.tag) ?? THEME_ORDER.size;
    const bRank = THEME_ORDER.get(b.tag) ?? THEME_ORDER.size;
    return aRank - bRank;
  });
}

function accuracy(state?: CardState): number {
  return (state?.timesCorrect ?? 0) / (state?.timesReviewed ?? 1);
}

/**
 * The daily session plan: due first (oldest due date first), then weak cards
 * not already in the due list, then a capped batch of brand-new cards, with no
 * card appearing twice.
 *
 * A learner who has already hit the daily goal gets a full repeat queue rather
 * than an empty one; the caller decides whether those grades count for progress.
 */
export function buildDailyQueue(
  cards: VocabularyCard[],
  states: CardStates,
  today: string,
  dailyGoal: number,
  cardsStudiedToday: number,
  newCardsPerDay = DEFAULT_NEW_CARDS_PER_DAY,
): VocabularyCard[] {
  const sessionSize = Math.max(0, dailyGoal - cardsStudiedToday);
  const dueCards = cards
    .filter((card) => {
      const due = states[card.id]?.due;
      return Boolean(due && due <= today);
    })
    .sort((a, b) => (states[a.id]?.due ?? today).localeCompare(states[b.id]?.due ?? today));

  const dueIds = new Set(dueCards.map((card) => card.id));
  const weakCards = cards
    .filter((card) => {
      const state = states[card.id];
      return (
        Boolean(state?.timesReviewed) &&
        getMasteryState(state) !== "known" &&
        state?.lastReviewDate !== today &&
        !dueIds.has(card.id)
      );
    })
    .sort((a, b) => accuracy(states[a.id]) - accuracy(states[b.id]));

  // Theme order first; the deck keeps its curated order inside a theme, so a
  // beginner meets survival and daily phrases before broad vocabulary.
  const newCards = orderNewCardsByTheme(cards.filter((card) => !states[card.id])).slice(0, newCardsPerDay);

  const planned = [...dueCards, ...weakCards, ...newCards].filter(
    (card, position, all) => all.findIndex((item) => item.id === card.id) === position,
  );
  return planned.slice(0, sessionSize || dailyGoal);
}

/** Weak Words: all reviewed cards, lowest accuracy first. */
export function selectWeakCards(
  cards: VocabularyCard[],
  states: CardStates,
  today: string,
  limit = 10,
): VocabularyCard[] {
  return preferNotReviewedToday(
    cards.filter((card) => Boolean(states[card.id]?.timesReviewed)),
    states,
    today,
  )
    .sort((a, b) => {
      const aState = states[a.id];
      const bState = states[b.id];
      return accuracy(aState) - accuracy(bState) || (bState?.timesReviewed ?? 0) - (aState?.timesReviewed ?? 0);
    })
    .slice(0, limit);
}

/** Learning and Shaky cards that need another pass, earliest due first. */
export function selectLearningCards(
  cards: VocabularyCard[],
  states: CardStates,
  today: string,
  limit = 10,
): VocabularyCard[] {
  return preferNotReviewedToday(
    cards.filter((card) => {
      const mastery = getMasteryState(states[card.id]);
      return mastery === "learning" || mastery === "shaky";
    }),
    states,
    today,
  )
    .sort((a, b) => (states[a.id]?.due ?? "9999-12-31").localeCompare(states[b.id]?.due ?? "9999-12-31"))
    .slice(0, limit);
}

/**
 * Cards reviewed today no longer move their schedule or earn XP, so prefer the
 * rest; fall back to them only so the lists stay usable for practice.
 */
export function preferNotReviewedToday(
  cards: VocabularyCard[],
  states: CardStates,
  today: string,
): VocabularyCard[] {
  const fresh = cards.filter((card) => states[card.id]?.lastReviewDate !== today);
  return fresh.length > 0 ? fresh : cards;
}

export function countOverdue(cards: VocabularyCard[], states: CardStates, today: string): number {
  return cards.reduce((count, card) => {
    const due = states[card.id]?.due;
    return count + (due && due <= today ? 1 : 0);
  }, 0);
}

export interface ForecastDay {
  key: string;
  count: number;
}

/**
 * Scheduled reviews per day for the next `dayCount` days. The first day can
 * include overdue reviews (the dashboard's short forecast does), or only cards
 * actually due today (the 30-day outlook counts scheduled work).
 */
export function buildReviewForecast(
  cards: VocabularyCard[],
  states: CardStates,
  today: string,
  dayCount: number,
  options: { overdueOnFirstDay?: boolean } = {},
): ForecastDay[] {
  const dueCounts = new Map<string, number>();
  let overdueTotal = 0;
  for (const card of cards) {
    const due = states[card.id]?.due;
    if (!due) continue;
    dueCounts.set(due, (dueCounts.get(due) ?? 0) + 1);
    if (due <= today) overdueTotal += 1;
  }

  return Array.from({ length: dayCount }, (_, offset) => {
    const key = addDays(today, offset);
    const count =
      offset === 0 && options.overdueOnFirstDay ? overdueTotal : dueCounts.get(key) ?? 0;
    return { key, count };
  });
}

export type WorkloadStatus = "balanced" | "busy" | "heavy";

export function summarizeForecast<T extends ForecastDay>(
  days: T[],
  dailyGoal: number,
): { total: number; peak: T; status: WorkloadStatus } {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const peak = days.reduce(
    (best, day) => (day.count > best.count ? day : best),
    days[0] ?? ({ key: "", count: 0 } as T),
  );
  const status: WorkloadStatus =
    peak.count >= Math.max(6, dailyGoal * 2) ? "heavy" : peak.count > dailyGoal ? "busy" : "balanced";
  return { total, peak, status };
}

export function nextScheduledReview(states: CardStates, today: string): string | undefined {
  return Object.values(states)
    .map((card) => card.due)
    .filter((due) => due > today)
    .sort()[0];
}

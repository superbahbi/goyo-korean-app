import {
  getMasteryState,
  type CardState,
  type MasteryState,
} from "@/lib/mastery";
import type { StudyDays } from "@/lib/studyDays";
import { daysStudiedWithin, reviewsWithin } from "@/lib/studyDays";
import { CATEGORIES, type VocabularyCard } from "@/lib/vocabulary";
import {
  buildDailyQueue,
  buildReviewForecast,
  countOverdue,
  nextScheduledReview as findNextScheduledReview,
  selectLearningCards,
  selectRecognitionCards,
  selectShadowingCards,
  selectWeakCards,
  summarizeForecast,
  type ForecastDay,
  type WorkloadStatus,
} from "@/lib/queue";
import {
  levelProgress as getLevelProgress,
  levelTitle as getLevelTitle,
  xpToReachLevel,
} from "@/lib/xp";
import {
  describeTodayProgress,
  isFirstRunState,
  type TodayProgress,
} from "@/lib/dashboardProgress";
import { goalProgress } from "@/lib/gradeIntent";

/**
 * Dashboard today-view model: one pure builder for everything the dashboard
 * shows. The React hook supplies saved state and the date formatter; it does not
 * re-derive the plan, availability, categories, or stats payload.
 */

/** The one category shape shared by the theme grid and the stats dialog. */
export interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  reviewed: number;
  total: number;
  accuracy: number | null;
  known: number;
  coverage: number;
}

/** A forecast day with its locale label resolved by the injected formatter. */
export interface LabeledForecastDay extends ForecastDay {
  label: string;
}

export type StatsForecastDay = LabeledForecastDay;

export interface StatsDialogStats {
  level: number;
  totalXp: number;
  nextLevelXp: number;
  streak: number;
  levelTitle: string;
  levelProgress: number;
  totalReviews: number;
  overallAccuracy: number;
  masteredCount: number;
  medianResponseTime: number | null;
  overdueCount: number;
  daysStudied7: number;
  daysStudied30: number;
  reviews7: number;
  masteryCounts: Record<MasteryState, number>;
  categories: CategorySummary[];
}

export interface StatsDialogForecast {
  days: StatsForecastDay[];
  total: number;
  peak: StatsForecastDay;
}

export type PracticeModeId =
  | "daily"
  | "listening"
  | "scenario"
  | "shadowing"
  | "weak"
  | "learning";

export type AvailabilityReason =
  | "empty"
  | "too-few-reviewed-cards"
  | "no-scenarios";

export interface ModeAvailability {
  available: boolean;
  /** Why the mode cannot start, or null when it can. */
  reason: AvailabilityReason | null;
}

export interface ReviewStats {
  totalReviews: number;
  overallAccuracy: number;
  medianResponseTime: number | null;
}

export interface TodayPlan {
  firstRun: boolean;
  plannedCards: number;
  newCards: number;
  cardsRemaining: number;
  overdueCount: number;
  dailyGoalReached: boolean;
  progress: TodayProgress;
  /** The exact hero summary for the current plan. */
  summary: string;
}

export interface DashboardView {
  today: {
    cardsStudiedToday: number;
    firstRun: boolean;
    dailyGoalReached: boolean;
    cardsRemaining: number;
    plan: TodayPlan;
  };
  modes: Record<PracticeModeId, ModeAvailability>;
  pools: {
    queue: VocabularyCard[];
    recognitionCards: VocabularyCard[];
    weakCards: VocabularyCard[];
    learningCards: VocabularyCard[];
  };
  stats: {
    daysStudied7: number;
    daysStudied30: number;
    reviews7: number;
    masteryCounts: Record<MasteryState, number>;
    reviewStats: ReviewStats;
    categories: CategorySummary[];
    levelTitle: string;
    levelProgress: number;
    nextLevelXp: number;
  };
  review: {
    overdueCount: number;
    nextScheduledReview: string | undefined;
    forecast: LabeledForecastDay[];
    extendedForecast: LabeledForecastDay[];
    total: number;
    peak: LabeledForecastDay;
    status: WorkloadStatus;
  };
  dialog: {
    stats: StatsDialogStats;
    forecast: StatsDialogForecast;
  };
}

export type ForecastLabelStyle = "weekday" | "monthDay";

export interface DashboardViewInput {
  vocabulary: VocabularyCard[];
  studyReady: VocabularyCard[];
  cardStates: Record<string, CardState>;
  studyDays: StudyDays;
  reviewEntries: number;
  today: string;
  dailyGoal: number;
  newCardsPerDay: number;
  level: number;
  totalXp: number;
  streak: number;
  /** Card ids that have a scenario; scenario practice needs at least one. */
  scenarioCardIds: readonly string[];
  /** Locale policy is injected so the builder stays pure and testable. */
  labelDate: (key: string, style: ForecastLabelStyle) => string;
}

/** The number of reviewed cards recognition practice needs to be useful. */
export const RECOGNITION_MIN_CARDS = 4;

function available(): ModeAvailability {
  return { available: true, reason: null };
}

function unavailable(reason: AvailabilityReason): ModeAvailability {
  return { available: false, reason };
}

function summarizePlan({
  cardsRemaining,
  plannedCards,
  overdueCount,
}: Omit<
  TodayPlan,
  "firstRun" | "progress" | "summary" | "newCards" | "dailyGoalReached"
>): string {
  if (cardsRemaining > 0) {
    if (plannedCards === 0) {
      return "Today's scheduled reviews are complete. New words resume tomorrow.";
    }
    const duePart =
      overdueCount > 0
        ? `${overdueCount} review${overdueCount === 1 ? "" : "s"} due · `
        : "";
    return `${duePart}${plannedCards} card${plannedCards === 1 ? "" : "s"} planned for today`;
  }
  return "You've hit today's goal. Extra practice is optional from here.";
}

function buildCategories(
  vocabulary: VocabularyCard[],
  cardStates: Record<string, CardState>
): CategorySummary[] {
  return CATEGORIES.map(category => {
    const cards = vocabulary.filter(card => card.tag === category.id);
    const reviewed = cards.filter(card =>
      Boolean(cardStates?.[card.id]?.timesReviewed)
    );
    const reviews = reviewed.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesReviewed ?? 0),
      0
    );
    const correct = reviewed.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesCorrect ?? 0),
      0
    );
    const known = cards.filter(
      card => getMasteryState(cardStates?.[card.id]) === "known"
    ).length;
    return {
      ...category,
      reviewed: reviewed.length,
      total: cards.length,
      accuracy: reviews > 0 ? Math.round((correct / reviews) * 100) : null,
      known,
      coverage: cards.length > 0 ? Math.round((known / cards.length) * 100) : 0,
    };
  });
}

function buildReviewStats(
  vocabulary: VocabularyCard[],
  cardStates: Record<string, CardState>
): ReviewStats {
  const reviewedCards = vocabulary.filter(card =>
    Boolean(cardStates[card.id]?.timesReviewed)
  );
  const totalReviews = reviewedCards.reduce(
    (sum, card) => sum + (cardStates[card.id]?.timesReviewed ?? 0),
    0
  );
  const totalCorrect = reviewedCards.reduce(
    (sum, card) => sum + (cardStates[card.id]?.timesCorrect ?? 0),
    0
  );
  const responseTimes = reviewedCards
    .map(card => cardStates[card.id]?.lastResponseTimeMs)
    .filter((time): time is number => typeof time === "number" && time > 0)
    .sort((a, b) => a - b);
  return {
    totalReviews,
    overallAccuracy:
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
    medianResponseTime:
      responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : null,
  };
}

function buildModes(
  queue: VocabularyCard[],
  recognitionCards: VocabularyCard[],
  weakCards: VocabularyCard[],
  learningCards: VocabularyCard[],
  shadowingCards: VocabularyCard[],
  scenarioCardIds: readonly string[]
): Record<PracticeModeId, ModeAvailability> {
  const recognitionReady = recognitionCards.length >= RECOGNITION_MIN_CARDS;
  const recognitionIds = new Set(recognitionCards.map(card => card.id));
  const hasScenario = scenarioCardIds.some(id => recognitionIds.has(id));

  return {
    daily: queue.length > 0 ? available() : unavailable("empty"),
    listening: recognitionReady
      ? available()
      : unavailable("too-few-reviewed-cards"),
    scenario: !recognitionReady
      ? unavailable("too-few-reviewed-cards")
      : hasScenario
        ? available()
        : unavailable("no-scenarios"),
    shadowing: shadowingCards.length > 0 ? available() : unavailable("empty"),
    weak: weakCards.length > 0 ? available() : unavailable("empty"),
    learning: learningCards.length > 0 ? available() : unavailable("empty"),
  };
}

export function buildDashboardView({
  vocabulary,
  studyReady,
  cardStates,
  studyDays,
  reviewEntries,
  today,
  dailyGoal,
  newCardsPerDay,
  level,
  totalXp,
  streak,
  scenarioCardIds,
  labelDate,
}: DashboardViewInput): DashboardView {
  const cardsStudiedToday = studyDays[today]?.cards ?? 0;
  const daysStudied7 = daysStudiedWithin(studyDays, today, 7);
  const daysStudied30 = daysStudiedWithin(studyDays, today, 30);
  const reviews7 = reviewsWithin(studyDays, today, 7);

  const masteryCounts = vocabulary.reduce<Record<MasteryState, number>>(
    (counts, card) => {
      counts[getMasteryState(cardStates?.[card.id])] += 1;
      return counts;
    },
    { new: 0, learning: 0, shaky: 0, known: 0 }
  );
  const reviewStats = buildReviewStats(vocabulary, cardStates);
  const categories = buildCategories(vocabulary, cardStates);

  const queue = buildDailyQueue(
    studyReady,
    cardStates,
    today,
    dailyGoal,
    cardsStudiedToday,
    newCardsPerDay
  );
  const newCards = queue.filter(
    card => !cardStates[card.id]?.timesReviewed
  ).length;
  const recognitionCards = selectRecognitionCards(
    studyReady,
    cardStates,
    today
  );
  const weakCards = selectWeakCards(studyReady, cardStates, today);
  const learningCards = selectLearningCards(studyReady, cardStates, today);
  const shadowingCards = selectShadowingCards(studyReady);

  const reviewForecast = buildReviewForecast(studyReady, cardStates, today, 7, {
    overdueOnFirstDay: true,
  }).map((day, offset) => ({
    ...day,
    label:
      offset === 0
        ? "Today"
        : offset === 1
          ? "Tmrw"
          : labelDate(day.key, "weekday"),
  }));
  const extendedReviewForecast = buildReviewForecast(
    studyReady,
    cardStates,
    today,
    30
  ).map(day => ({
    ...day,
    label: labelDate(day.key, "monthDay"),
  }));

  const {
    total: forecastTotal,
    peak: forecastPeak,
    status: workloadStatus,
  } = summarizeForecast(extendedReviewForecast, dailyGoal);

  const { reached: dailyGoalReached, remaining: cardsRemaining } = goalProgress(
    dailyGoal,
    cardsStudiedToday
  );
  const overdueCount = countOverdue(studyReady, cardStates, today);
  const nextScheduledReview = findNextScheduledReview(
    cardStates,
    vocabulary,
    today
  );
  const firstRun = isFirstRunState({
    reviewEntries,
    cardStates: Object.keys(cardStates).length,
    studiedToday: cardsStudiedToday,
  });
  // Once the daily goal is reached the queue becomes optional repeat practice,
  // so it is no longer part of the planned work for the day.
  const progress = describeTodayProgress({
    studied: cardsStudiedToday,
    remaining: dailyGoalReached ? 0 : queue.length,
    dailyGoal,
  });

  const plan: TodayPlan = {
    firstRun,
    plannedCards: queue.length,
    newCards,
    cardsRemaining,
    overdueCount,
    dailyGoalReached,
    progress,
    summary: summarizePlan({
      cardsRemaining,
      plannedCards: queue.length,
      overdueCount,
    }),
  };

  const levelTitle = getLevelTitle(level);
  const nextLevelXp = xpToReachLevel(level + 1);
  const levelProgress = getLevelProgress(totalXp, level);

  return {
    today: {
      cardsStudiedToday,
      firstRun,
      dailyGoalReached,
      cardsRemaining,
      plan,
    },
    modes: buildModes(
      queue,
      recognitionCards,
      weakCards,
      learningCards,
      shadowingCards,
      scenarioCardIds
    ),
    pools: { queue, recognitionCards, weakCards, learningCards },
    stats: {
      daysStudied7,
      daysStudied30,
      reviews7,
      masteryCounts,
      reviewStats,
      categories,
      levelTitle,
      levelProgress,
      nextLevelXp,
    },
    review: {
      overdueCount,
      nextScheduledReview,
      forecast: reviewForecast,
      extendedForecast: extendedReviewForecast,
      total: forecastTotal,
      peak: forecastPeak,
      status: workloadStatus,
    },
    dialog: {
      stats: {
        level,
        totalXp,
        nextLevelXp,
        streak,
        levelTitle,
        levelProgress,
        totalReviews: reviewStats.totalReviews,
        overallAccuracy: reviewStats.overallAccuracy,
        masteredCount: masteryCounts.known,
        medianResponseTime: reviewStats.medianResponseTime,
        overdueCount,
        daysStudied7,
        daysStudied30,
        reviews7,
        masteryCounts,
        categories,
      },
      forecast: {
        days: extendedReviewForecast,
        total: forecastTotal,
        peak: forecastPeak,
      },
    },
  };
}

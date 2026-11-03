import type { CardState, MasteryState } from "@/lib/mastery";
import type { StudyDays } from "@/lib/studyDays";
import { daysStudiedWithin, reviewsWithin } from "@/lib/studyDays";
import type { VocabularyCard } from "@/lib/vocabulary";
import {
  buildDailyQueue,
  countOverdue,
  nextScheduledReview as findNextScheduledReview,
  selectLearningCards,
  selectRecognitionCards,
  selectShadowingCards,
  selectWeakCards,
  type WorkloadStatus,
} from "@/lib/queue";
import {
  levelProgress as getLevelProgress,
  levelTitle as getLevelTitle,
  xpToReachLevel,
} from "@/lib/xp";
import { isFirstRunState } from "@/lib/dashboardProgress";
import { goalProgress } from "@/lib/gradeIntent";
import {
  buildDashboardStats,
  type CategorySummary,
  type ReviewStats,
} from "@/lib/dashboardStats";
import {
  buildDashboardForecast,
  type ForecastLabelStyle,
  type LabeledForecastDay,
  type StatsForecastDay,
} from "@/lib/dashboardForecast";
import {
  buildModeAvailability,
  buildTodayPlan,
  type ModeAvailability,
  type PracticeModeId,
  type TodayPlan,
} from "@/lib/dashboardPlan";

/**
 * Dashboard today-view model: one pure builder for everything the dashboard
 * shows. Statistics, today's plan, mode availability and the review forecast
 * live in their own focused modules; this file composes them. The React hook
 * supplies saved state and the date formatter; it does not re-derive the plan,
 * availability, categories, or stats payload.
 */

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

  const { masteryCounts, reviewStats, categories } = buildDashboardStats(
    vocabulary,
    cardStates
  );

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

  const review = buildDashboardForecast({
    studyReady,
    cardStates,
    today,
    dailyGoal,
    labelDate,
  });

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

  const plan = buildTodayPlan({
    queue,
    newCards,
    cardsRemaining,
    overdueCount,
    firstRun,
    dailyGoalReached,
    studied: cardsStudiedToday,
    dailyGoal,
  });

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
    modes: buildModeAvailability(
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
      ...review,
      overdueCount,
      nextScheduledReview,
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
        days: review.extendedForecast,
        total: review.total,
        peak: review.peak,
      },
    },
  };
}

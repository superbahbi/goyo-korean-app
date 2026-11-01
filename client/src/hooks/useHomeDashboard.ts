import { useMemo } from "react";
import {
  getMasteryState,
  type CardState,
  type MasteryState,
} from "@/hooks/useStudyState";
import type { StudyDays } from "@/lib/studyDays";
import { daysStudiedWithin, reviewsWithin } from "@/lib/studyDays";
import { CATEGORIES, type VocabularyCard } from "@/lib/vocabulary";
import {
  buildDailyQueue,
  buildReviewForecast,
  countOverdue,
  nextScheduledReview as getNextScheduledReview,
  selectLearningCards,
  selectWeakCards,
  summarizeForecast,
} from "@/lib/queue";
import {
  levelProgress as getLevelProgress,
  levelTitle as getLevelTitle,
  xpToReachLevel,
} from "@/lib/xp";
import {
  describeTodayProgress,
  isFirstRunState,
} from "@/lib/dashboardProgress";

interface UseHomeDashboardOptions {
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
}

/**
 * Every value the dashboard sections read. Keeping the derivations here leaves
 * Home as the state, handlers, and composition layer.
 */
export function useHomeDashboard({
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
}: UseHomeDashboardOptions) {
  const cardsStudiedToday = studyDays[today]?.cards ?? 0;
  const daysStudied7 = daysStudiedWithin(studyDays, today, 7);
  const daysStudied30 = daysStudiedWithin(studyDays, today, 30);
  const reviews7 = reviewsWithin(studyDays, today, 7);

  const masteryCounts = useMemo(
    () =>
      vocabulary.reduce<Record<MasteryState, number>>(
        (counts, card) => {
          counts[getMasteryState(cardStates?.[card.id])] += 1;
          return counts;
        },
        { new: 0, learning: 0, shaky: 0, known: 0 }
      ),
    [vocabulary, cardStates]
  );

  const reviewStats = useMemo(() => {
    const reviewedCards = cardStates
      ? vocabulary.filter(card => Boolean(cardStates[card.id]?.timesReviewed))
      : [];
    const totalReviews = reviewedCards.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesReviewed ?? 0),
      0
    );
    const totalCorrect = reviewedCards.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesCorrect ?? 0),
      0
    );
    const overallAccuracy =
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
    const responseTimes = reviewedCards
      .map(card => cardStates?.[card.id]?.lastResponseTimeMs)
      .filter((time): time is number => typeof time === "number" && time > 0)
      .sort((a, b) => a - b);
    const medianResponseTime =
      responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : null;
    return { totalReviews, overallAccuracy, medianResponseTime };
  }, [vocabulary, cardStates]);

  const categoryMastery = useMemo(
    () =>
      CATEGORIES.map(category => {
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
          coverage:
            cards.length > 0 ? Math.round((known / cards.length) * 100) : 0,
        };
      }),
    [vocabulary, cardStates]
  );

  // Derived from saved progress, so it is current on the same render as a grade.
  const queue = useMemo(() => {
    return buildDailyQueue(
      studyReady,
      cardStates,
      today,
      dailyGoal,
      cardsStudiedToday,
      newCardsPerDay
    );
  }, [
    cardStates,
    cardsStudiedToday,
    dailyGoal,
    studyReady,
    today,
    newCardsPerDay,
  ]);

  // New cards in today's queue, used by the hero's plan summary.
  const newCardsPlanned = useMemo(
    () => queue.filter(card => !cardStates[card.id]?.timesReviewed).length,
    [queue, cardStates]
  );

  // Recognition practice never introduces a card: due and weak reviews come
  // first, then the rest of the learner's existing cards.
  const recognitionCards = useMemo(() => {
    const reviewed = studyReady.filter(card =>
      Boolean(cardStates[card.id]?.timesReviewed)
    );
    const due = reviewed
      .filter(card => {
        const dueDate = cardStates[card.id]?.due;
        return Boolean(dueDate && dueDate <= today);
      })
      .sort((a, b) =>
        (cardStates[a.id]?.due ?? today).localeCompare(
          cardStates[b.id]?.due ?? today
        )
      );
    const dueIds = new Set(due.map(card => card.id));
    const weak = reviewed
      .filter(
        card =>
          !dueIds.has(card.id) &&
          getMasteryState(cardStates[card.id]) !== "known"
      )
      .sort((a, b) => {
        const aState = cardStates[a.id];
        const bState = cardStates[b.id];
        return (
          (aState?.timesCorrect ?? 0) / (aState?.timesReviewed ?? 1) -
          (bState?.timesCorrect ?? 0) / (bState?.timesReviewed ?? 1)
        );
      });
    const weakIds = new Set(weak.map(card => card.id));
    const rest = reviewed.filter(
      card => !dueIds.has(card.id) && !weakIds.has(card.id)
    );
    return [...due, ...weak, ...rest];
  }, [cardStates, studyReady, today]);

  const weakCards = useMemo(
    () => selectWeakCards(studyReady, cardStates, today),
    [studyReady, cardStates, today]
  );
  const learningCards = useMemo(
    () => selectLearningCards(studyReady, cardStates, today),
    [studyReady, cardStates, today]
  );

  const reviewForecast = useMemo(() => {
    return buildReviewForecast(studyReady, cardStates, today, 7, {
      overdueOnFirstDay: true,
    }).map((day, offset) => ({
      ...day,
      label:
        offset === 0
          ? "Today"
          : offset === 1
            ? "Tmrw"
            : new Date(`${day.key}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "short",
              }),
    }));
  }, [studyReady, cardStates, today]);

  const extendedReviewForecast = useMemo(() => {
    return buildReviewForecast(studyReady, cardStates, today, 30).map(day => ({
      ...day,
      label: new Date(`${day.key}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [studyReady, cardStates, today]);

  const {
    total: forecastTotal,
    peak: forecastPeak,
    status: workloadStatus,
  } = useMemo(
    () => summarizeForecast(extendedReviewForecast, dailyGoal),
    [extendedReviewForecast, dailyGoal]
  );

  const cardsRemaining = Math.max(0, dailyGoal - cardsStudiedToday);
  const dailyGoalReached = cardsStudiedToday >= dailyGoal;
  const overdueCount = countOverdue(studyReady, cardStates, today);
  const nextScheduledReview = getNextScheduledReview(
    cardStates,
    vocabulary,
    today
  );

  const firstRun = isFirstRunState({
    reviewEntries,
    studiedToday: cardsStudiedToday,
  });
  // Once the daily goal is reached the queue becomes optional repeat practice,
  // so it is no longer part of the planned work for the day.
  const todayProgress = describeTodayProgress({
    studied: cardsStudiedToday,
    remaining: dailyGoalReached ? 0 : queue.length,
    dailyGoal,
  });

  return {
    cardsStudiedToday,
    daysStudied7,
    daysStudied30,
    reviews7,
    masteryCounts,
    reviewStats,
    categoryMastery,
    queue,
    recognitionCards,
    weakCards,
    learningCards,
    reviewForecast,
    extendedReviewForecast,
    forecastTotal,
    forecastPeak,
    workloadStatus,
    cardsRemaining,
    plannedCards: queue.length,
    newCardsPlanned,
    firstRun,
    todayProgress,
    dailyGoalReached,
    levelTitle: getLevelTitle(level),
    nextLevelXp: xpToReachLevel(level + 1),
    levelProgress: getLevelProgress(totalXp, level),
    overdueCount,
    nextScheduledReview,
  };
}

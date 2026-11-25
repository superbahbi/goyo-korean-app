import { useMemo } from "react";
import type { CardState } from "@domain/mastery";
import type { StudyDays } from "@domain/studyDays";
import { buildDashboardView, type DashboardView } from "@domain/dashboardView";
import type { ForecastLabelStyle } from "@domain/dashboardForecast";
import { SCENARIOS } from "@/components/practice/scenarios";
import type { VocabularyCard } from "@domain/vocabulary";

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

const SCENARIO_CARD_IDS = SCENARIOS.map(scenario => scenario.cardId);

/** Locale formatting stays at the React edge; the builder stays pure. */
function labelDate(key: string, style: ForecastLabelStyle): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString(
    undefined,
    style === "weekday"
      ? { weekday: "short" }
      : { month: "short", day: "numeric" }
  );
}

/**
 * The dashboard's React wrapper: saved state in, one memoized view model out.
 * Derivation and formatting policy live in `buildDashboardView`.
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
}: UseHomeDashboardOptions): DashboardView {
  return useMemo(
    () =>
      buildDashboardView({
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
        scenarioCardIds: SCENARIO_CARD_IDS,
        labelDate,
      }),
    [
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
    ]
  );
}

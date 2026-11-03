import {
  describeTodayProgress,
  type TodayProgress,
} from "@/lib/dashboardProgress";
import type { VocabularyCard } from "@/lib/vocabulary";

/**
 * Today's plan and practice-mode availability. These are the dashboard rules
 * that depend on the built queue and pools, kept separate from the aggregate
 * statistics and the forecast.
 */

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
}: Pick<
  TodayPlan,
  "cardsRemaining" | "plannedCards" | "overdueCount"
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

export function buildModeAvailability(
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

export interface TodayPlanInput {
  queue: VocabularyCard[];
  newCards: number;
  cardsRemaining: number;
  overdueCount: number;
  firstRun: boolean;
  dailyGoalReached: boolean;
  studied: number;
  dailyGoal: number;
}

export function buildTodayPlan({
  queue,
  newCards,
  cardsRemaining,
  overdueCount,
  firstRun,
  dailyGoalReached,
  studied,
  dailyGoal,
}: TodayPlanInput): TodayPlan {
  // Once the daily goal is reached the queue becomes optional repeat practice,
  // so it is no longer part of the planned work for the day.
  const progress = describeTodayProgress({
    studied,
    remaining: dailyGoalReached ? 0 : queue.length,
    dailyGoal,
  });

  return {
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
}

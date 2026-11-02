import type { CardState } from "@/lib/mastery";
import type { StudyMode } from "@/lib/reviewLog";
import { scheduleReview, type SrsRating, type SrsSchedule } from "@/lib/srs";

/**
 * Grade intent: what one grade is for in its practice mode. This module owns
 * the three decisions that used to be re-derived by each caller — whether the
 * schedule moves, whether the grade earns XP, and whether it crosses the daily
 * goal — so the toast, the saved state, and the queue cannot disagree.
 */

type XpEligibility = "always" | "until-goal" | "never";
type Repeatability = "always" | "after-goal" | "never";

interface ModePolicy {
  /** Listening and scenario practice confirm familiarity without stretching. */
  recognition: boolean;
  /** Shadowing is self-reported: logged only. */
  updatesSchedule: boolean;
  xpEligibility: XpEligibility;
  repeatability: Repeatability;
}

const MODE_POLICY: Record<StudyMode, ModePolicy> = {
  daily: {
    recognition: false,
    updatesSchedule: true,
    xpEligibility: "until-goal",
    repeatability: "after-goal",
  },
  weak: {
    recognition: false,
    updatesSchedule: true,
    xpEligibility: "always",
    repeatability: "always",
  },
  learning: {
    recognition: false,
    updatesSchedule: true,
    xpEligibility: "always",
    repeatability: "always",
  },
  listening: {
    recognition: true,
    updatesSchedule: true,
    xpEligibility: "always",
    repeatability: "never",
  },
  scenario: {
    recognition: true,
    updatesSchedule: true,
    xpEligibility: "always",
    repeatability: "never",
  },
  shadowing: {
    recognition: false,
    updatesSchedule: false,
    xpEligibility: "never",
    repeatability: "never",
  },
};

const XP_BY_RATING: Record<SrsRating, number> = {
  again: 5,
  good: 10,
  easy: 15,
};

export interface GradeContext {
  mode: StudyMode;
  existing: CardState | undefined;
  today: string;
  dailyGoal: number;
  /** Distinct cards graded today, i.e. the day's `cards` count. */
  studiedToday: number;
}

export interface GoalProgress {
  reached: boolean;
  /** Cards still needed for the goal; 0 once it is reached. */
  remaining: number;
  /** How large today's practice queue is: remaining work, or a full repeat queue. */
  repeatQueueSize: number;
}

export function goalProgress(
  dailyGoal: number,
  studiedToday: number
): GoalProgress {
  const reached = studiedToday >= dailyGoal;
  return {
    reached,
    remaining: Math.max(0, dailyGoal - studiedToday),
    repeatQueueSize: reached ? dailyGoal : dailyGoal - studiedToday,
  };
}

export interface GradeDecision {
  /** Null when the mode never touches the schedule (practice-only). */
  schedule: SrsSchedule | null;
  /** The scheduler accepted the grade and moved the schedule. */
  advanced: boolean;
  /** This grade adds one to the day's distinct-card count. */
  countsAsNewCard: boolean;
  /** XP this grade actually awards. */
  xp: number;
  /** This grade crosses the daily goal for the first time. */
  goalJustReached: boolean;
  /** Daily practice offered after the goal is met. */
  repeatPractice: boolean;
}

export function evaluateGrade(
  context: GradeContext,
  rating: SrsRating,
  responseTimeMs?: number
): GradeDecision {
  const policy = MODE_POLICY[context.mode];

  if (!policy.updatesSchedule) {
    return {
      schedule: null,
      advanced: false,
      countsAsNewCard: false,
      xp: 0,
      goalJustReached: false,
      repeatPractice: false,
    };
  }

  const progress = goalProgress(context.dailyGoal, context.studiedToday);
  const { schedule, advanced } = scheduleReview(
    context.existing,
    rating,
    context.today,
    responseTimeMs,
    { recognition: policy.recognition }
  );
  const countsAsNewCard = context.existing?.lastReviewDate !== context.today;
  const earnsXp =
    policy.xpEligibility === "always" ||
    (policy.xpEligibility === "until-goal" && !progress.reached);

  return {
    schedule,
    advanced,
    countsAsNewCard,
    xp: earnsXp && advanced ? XP_BY_RATING[rating] : 0,
    // The day counter keys off distinct cards, not XP: a same-day lapse can
    // award XP without crossing the goal.
    goalJustReached:
      !progress.reached &&
      countsAsNewCard &&
      context.studiedToday + 1 >= context.dailyGoal,
    repeatPractice: policy.xpEligibility === "until-goal" && progress.reached,
  };
}

/** Whether a study session offers "Practice again" on its summary. */
export function repeatableSession(
  mode: StudyMode,
  goalReached: boolean
): boolean {
  const { repeatability } = MODE_POLICY[mode];
  return (
    repeatability === "always" ||
    (repeatability === "after-goal" && goalReached)
  );
}

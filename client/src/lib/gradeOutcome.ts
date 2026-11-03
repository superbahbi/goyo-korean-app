import type { UserState } from "@/lib/savedState";
import { addDays, getLocalDateKey } from "@/lib/day";
import { evaluateGrade } from "@/lib/gradeIntent";
import type { CardState } from "@/lib/mastery";
import { levelFromXp } from "@/lib/xp";
import { appendReviewEntry, type StudyMode } from "@/lib/reviewLog";
import { deriveStreak, recordStudyDay } from "@/lib/studyDays";

/**
 * Grade outcome: the one place a learner's grade becomes saved progress.
 *
 * `evaluateGrade` decides the grade's intent; this module applies that decision
 * to the saved state and returns both the next state and the small outcome the
 * caller needs (XP, goal crossing, repeatability). The toast and the save can
 * therefore never disagree, and no caller has to re-run the intent.
 */
export interface GradeOptions {
  responseTimeMs?: number;
  /** The practice mode decides whether this grade counts for progress. */
  mode?: StudyMode;
}

export interface GradeOutcome {
  /** XP this grade actually awards. */
  xp: number;
  /** This grade crosses the daily goal for the first time. */
  goalJustReached: boolean;
  /** Practice-again is offered for this grade's mode and goal state. */
  repeatable: boolean;
  /** This grade adds one to the day's distinct-card count. */
  countsAsNewCard: boolean;
}

export interface GradeResult {
  state: UserState;
  outcome: GradeOutcome;
}

export function applyGradeOutcome(
  state: UserState,
  cardId: string,
  rating: "again" | "good" | "easy",
  options: GradeOptions = {},
  now = new Date()
): GradeResult {
  const today = getLocalDateKey(now);
  const mode: StudyMode = options.mode ?? "daily";
  const logEntry = {
    cardId,
    at: now.toISOString(),
    rating,
    responseTimeMs:
      typeof options.responseTimeMs === "number"
        ? options.responseTimeMs
        : null,
    mode,
  } as const;

  const decision = evaluateGrade(
    {
      mode,
      existing: state.cardStates[cardId],
      today,
      dailyGoal: state.settings.dailyGoal,
      studiedToday: state.studyDays[today]?.cards ?? 0,
    },
    rating,
    options.responseTimeMs
  );

  const outcome: GradeOutcome = {
    xp: decision.xp,
    goalJustReached: decision.goalJustReached,
    repeatable: decision.repeatable,
    countsAsNewCard: decision.countsAsNewCard,
  };

  // Practice-only grades still belong in the log, but they must not move the
  // schedule, earn XP, or count toward the daily goal.
  if (!decision.schedule) {
    return {
      state: {
        ...state,
        reviewLog: appendReviewEntry(state.reviewLog, logEntry),
      },
      outcome,
    };
  }

  const existingCard = state.cardStates[cardId];
  const { schedule, advanced } = decision;
  const xpGain = decision.xp;

  const studyDays = recordStudyDay(state.studyDays, today, {
    cardFirstSeenToday: decision.countsAsNewCard,
    scheduleAdvanced: advanced,
  });
  const newStreak = deriveStreak(studyDays, today);
  const newHighestStreak = Math.max(state.stats.highestStreak, newStreak);

  const responseTimeMs = options.responseTimeMs;
  const newCardState: CardState = {
    id: cardId,
    due:
      advanced || !existingCard
        ? addDays(today, schedule.interval)
        : existingCard.due,
    interval: schedule.interval,
    timesReviewed: (existingCard?.timesReviewed || 0) + (advanced ? 1 : 0),
    timesCorrect:
      (existingCard?.timesCorrect || 0) +
      (advanced && rating !== "again" ? 1 : 0),
    lastReviewDate: today,
    easeFactor: schedule.easeFactor,
    consecutiveCorrect: schedule.consecutiveCorrect,
    lapseCount: schedule.lapseCount,
    lastResponseTimeMs:
      typeof responseTimeMs === "number"
        ? responseTimeMs
        : existingCard?.lastResponseTimeMs,
  };

  return {
    state: {
      ...state,
      cardStates: {
        ...state.cardStates,
        [cardId]: newCardState,
      },
      stats: {
        totalXp: state.stats.totalXp + xpGain,
        level: levelFromXp(state.stats.totalXp + xpGain),
        lastStudyDate: today,
        streak: newStreak,
        highestStreak: newHighestStreak,
        totalCardsLearned:
          advanced &&
          rating !== "again" &&
          (existingCard?.timesCorrect ?? 0) === 0
            ? state.stats.totalCardsLearned + 1
            : state.stats.totalCardsLearned,
      },
      studyDays,
      // Every grade is logged, including a same-day repeat. The scheduler still
      // owns whether the schedule moves; the log records what the learner did.
      reviewLog: appendReviewEntry(state.reviewLog, logEntry),
    },
    outcome,
  };
}

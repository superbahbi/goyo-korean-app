/**
 * Honest progress for the dashboard. The daily goal can be larger than the
 * work that actually exists on a given day — a fresh learner has three new
 * cards and no reviews due — so progress is measured against today's planned
 * work instead: cards studied plus cards still left in the queue. The daily
 * goal stays visible as a separate secondary line.
 */

export interface TodayProgressInput {
  /** Distinct cards graded today. */
  studied: number;
  /** Cards still planned in today's queue. */
  remaining: number;
  /** The learner's daily goal, shown as the secondary line. */
  dailyGoal: number;
}

export interface TodayProgress {
  studied: number;
  planned: number;
  /** 0–100, rounded. Nothing planned reads as 0 rather than a full bar. */
  percent: number;
  /** e.g. "0 of 3 planned". */
  label: string;
  /** e.g. "Daily goal 10". */
  goalLine: string;
  /** True once today's planned work is finished and at least one card existed. */
  plannedComplete: boolean;
}

function count(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function describeTodayProgress({
  studied,
  remaining,
  dailyGoal,
}: TodayProgressInput): TodayProgress {
  const done = count(studied);
  const left = count(remaining);
  const planned = done + left;
  const goal = count(dailyGoal);

  return {
    studied: done,
    planned,
    percent: planned === 0 ? 0 : Math.round((done / planned) * 100),
    label: `${done} of ${planned} planned`,
    goalLine: `Daily goal ${goal}`,
    plannedComplete: planned > 0 && left === 0,
  };
}

/**
 * First run means nothing has ever been reviewed and nothing was studied
 * today. Any review history, or a graded card today, shows the full dashboard.
 */
export function isFirstRunState({
  reviewEntries,
  studiedToday,
}: {
  reviewEntries: number;
  studiedToday: number;
}): boolean {
  return count(reviewEntries) === 0 && count(studiedToday) === 0;
}

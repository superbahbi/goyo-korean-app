import { describe, expect, it } from "vitest";
import { describeTodayProgress, isFirstRunState } from "./dashboardProgress";

describe("describeTodayProgress", () => {
  it("measures a fresh learner against the three planned cards, not the goal", () => {
    expect(
      describeTodayProgress({ studied: 0, remaining: 3, dailyGoal: 10 })
    ).toEqual({
      studied: 0,
      planned: 3,
      percent: 0,
      label: "0 of 3 planned",
      goalLine: "Daily goal 10",
      plannedComplete: false,
    });
  });

  it("shows the daily goal on its own line and the planned work in the label", () => {
    const progress = describeTodayProgress({
      studied: 1,
      remaining: 2,
      dailyGoal: 10,
    });
    expect(progress.label).toBe("1 of 3 planned");
    expect(progress.goalLine).toBe("Daily goal 10");
    expect(progress.percent).toBe(33);
  });

  it("reaches 100% when the day's planned cards are finished", () => {
    const progress = describeTodayProgress({
      studied: 3,
      remaining: 0,
      dailyGoal: 10,
    });
    expect(progress.label).toBe("3 of 3 planned");
    expect(progress.percent).toBe(100);
    expect(progress.plannedComplete).toBe(true);
  });

  it("stays honest when the planned work equals the daily goal", () => {
    const progress = describeTodayProgress({
      studied: 10,
      remaining: 0,
      dailyGoal: 10,
    });
    expect(progress.label).toBe("10 of 10 planned");
    expect(progress.goalLine).toBe("Daily goal 10");
    expect(progress.plannedComplete).toBe(true);
  });

  it("rounds progress and treats a day with no planned cards as empty", () => {
    expect(
      describeTodayProgress({ studied: 2, remaining: 1, dailyGoal: 10 }).percent
    ).toBe(67);

    const empty = describeTodayProgress({
      studied: 0,
      remaining: 0,
      dailyGoal: 10,
    });
    expect(empty.label).toBe("0 of 0 planned");
    expect(empty.percent).toBe(0);
    expect(empty.plannedComplete).toBe(false);
  });

  it("ignores negative and non-finite counts from edited saves", () => {
    expect(
      describeTodayProgress({
        studied: -2,
        remaining: Number.NaN,
        dailyGoal: -10,
      })
    ).toEqual({
      studied: 0,
      planned: 0,
      percent: 0,
      label: "0 of 0 planned",
      goalLine: "Daily goal 0",
      plannedComplete: false,
    });
  });
});

describe("isFirstRunState", () => {
  it("is true only with no review history and nothing studied today", () => {
    expect(isFirstRunState({ reviewEntries: 0, studiedToday: 0 })).toBe(true);
  });

  it("is false once any review has been logged", () => {
    expect(isFirstRunState({ reviewEntries: 1, studiedToday: 0 })).toBe(false);
  });

  it("is false when today has studied cards even if the log is missing", () => {
    expect(isFirstRunState({ reviewEntries: 0, studiedToday: 1 })).toBe(false);
  });
});

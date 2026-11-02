import { describe, expect, it } from "vitest";
import type { CardState } from "@/lib/mastery";
import type { SrsRating } from "@/lib/srs";
import {
  evaluateGrade,
  goalProgress,
  repeatableSession,
  type GradeContext,
} from "./gradeIntent";

const today = "2026-11-01";

function cardState(overrides: Partial<CardState> = {}): CardState {
  return {
    id: "card_1",
    due: "2026-11-03",
    interval: 2,
    timesReviewed: 2,
    timesCorrect: 2,
    lastReviewDate: "2026-10-30",
    easeFactor: 2.35,
    consecutiveCorrect: 2,
    lapseCount: 0,
    ...overrides,
  };
}

function context(overrides: Partial<GradeContext> = {}): GradeContext {
  return {
    mode: "daily",
    existing: cardState(),
    today,
    dailyGoal: 10,
    studiedToday: 0,
    ...overrides,
  };
}

function decide(
  overrides: Partial<GradeContext> = {},
  rating: SrsRating = "good"
) {
  return evaluateGrade(context(overrides), rating);
}

describe("evaluateGrade", () => {
  it("awards the rating's XP for a daily grade below the goal", () => {
    expect(decide({}, "again").xp).toBe(5);
    expect(decide({}, "good").xp).toBe(10);
    expect(decide({}, "easy").xp).toBe(15);
    expect(decide()).toMatchObject({
      advanced: true,
      countsAsNewCard: true,
      goalJustReached: false,
      repeatPractice: false,
    });
  });

  it("stops awarding daily XP once the goal is reached", () => {
    const decision = decide({ studiedToday: 10 });
    expect(decision).toMatchObject({
      advanced: true,
      countsAsNewCard: true,
      xp: 0,
      goalJustReached: false,
      repeatPractice: true,
    });
  });

  it("reports the grade that crosses the goal", () => {
    expect(decide({ studiedToday: 9 }).goalJustReached).toBe(true);
    expect(decide({ studiedToday: 10 }).goalJustReached).toBe(false);
  });

  it("keeps earning XP in weak and learning practice past the goal", () => {
    expect(decide({ mode: "weak", studiedToday: 10 })).toMatchObject({
      xp: 10,
      repeatPractice: false,
    });
    expect(decide({ mode: "learning", studiedToday: 10 })).toMatchObject({
      xp: 10,
      repeatPractice: false,
    });
  });

  it("does not pay twice for a same-day repeat", () => {
    const decision = decide({
      existing: cardState({ lastReviewDate: today }),
    });
    expect(decision).toMatchObject({
      advanced: false,
      countsAsNewCard: false,
      xp: 0,
      goalJustReached: false,
    });
  });

  it("lets a same-day lapse award XP without counting a new card", () => {
    // Interval > 1 is a real lapse, so the scheduler accepts it; the day
    // counter still keys off the first grade of the card today.
    const decision = decide(
      {
        existing: cardState({ lastReviewDate: today, interval: 5 }),
        studiedToday: 9,
      },
      "again"
    );
    expect(decision).toMatchObject({
      advanced: true,
      countsAsNewCard: false,
      xp: 5,
      goalJustReached: false,
    });
  });

  it("does not accept a same-day lapse that is already due tomorrow", () => {
    const decision = decide(
      {
        existing: cardState({ lastReviewDate: today, interval: 1 }),
      },
      "again"
    );
    expect(decision).toMatchObject({ advanced: false, xp: 0 });
  });

  it("earns XP in recognition practice but caps the schedule", () => {
    const decision = evaluateGrade(
      context({ mode: "listening", existing: undefined }),
      "easy"
    );
    expect(decision).toMatchObject({
      advanced: true,
      countsAsNewCard: true,
      xp: 15,
    });
    // A first recognition meeting lands on the two-day reinforcer.
    expect(decision.schedule).toMatchObject({
      interval: 2,
      consecutiveCorrect: 0,
    });
  });

  it("logs practice-only grades without touching the schedule or progress", () => {
    const decision = evaluateGrade(context({ mode: "shadowing" }), "good");
    expect(decision).toEqual({
      schedule: null,
      advanced: false,
      countsAsNewCard: false,
      xp: 0,
      goalJustReached: false,
      repeatPractice: false,
    });
  });
});

describe("goalProgress", () => {
  it("reports the remaining work before the goal", () => {
    expect(goalProgress(10, 4)).toEqual({
      reached: false,
      remaining: 6,
      repeatQueueSize: 6,
    });
  });

  it("turns the queue into a full repeat round at the goal", () => {
    expect(goalProgress(10, 10)).toEqual({
      reached: true,
      remaining: 0,
      repeatQueueSize: 10,
    });
    expect(goalProgress(10, 12)).toEqual({
      reached: true,
      remaining: 0,
      repeatQueueSize: 10,
    });
  });
});

describe("repeatableSession", () => {
  it("offers a daily repeat only after the goal", () => {
    expect(repeatableSession("daily", false)).toBe(false);
    expect(repeatableSession("daily", true)).toBe(true);
  });

  it("always offers weak and learning practice", () => {
    expect(repeatableSession("weak", false)).toBe(true);
    expect(repeatableSession("learning", false)).toBe(true);
  });

  it("keeps the recognition modes out of the daily summary flow", () => {
    expect(repeatableSession("listening", true)).toBe(false);
    expect(repeatableSession("scenario", true)).toBe(false);
    expect(repeatableSession("shadowing", true)).toBe(false);
  });
});

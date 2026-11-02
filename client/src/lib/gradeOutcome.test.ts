import { describe, expect, it } from "vitest";
import { emptyGrammarProgress } from "@/lib/grammarProgress";
import { parseSavedState, type UserState } from "@/hooks/useStudyState";
import { applyGradeOutcome } from "./gradeOutcome";

const at = new Date("2026-11-01T09:30:00.000Z");
const today = "2026-11-01";

function baseState(overrides: Partial<UserState> = {}): UserState {
  const parsed = parseSavedState(
    JSON.stringify({
      cardStates: {},
      stats: {
        totalXp: 0,
        level: 1,
        streak: 0,
        lastStudyDate: "",
        highestStreak: 0,
        totalCardsLearned: 0,
      },
      settings: {
        dailyGoal: 10,
        newCardsPerDay: 3,
        autoPlayAudio: true,
        audioSpeaker: "elevenlabs",
      },
      studyDays: {},
      grammar: emptyGrammarProgress(),
    }),
    today
  );
  return {
    ...parsed,
    ...overrides,
    settings: { ...parsed.settings, ...overrides.settings },
  };
}

describe("applyGradeOutcome", () => {
  it("returns the saved state and the grade's outcome in one write", () => {
    const result = applyGradeOutcome(
      baseState(),
      "surv_001",
      "good",
      { mode: "daily", responseTimeMs: 2400 },
      at
    );

    expect(result.outcome).toEqual({
      xp: 10,
      goalJustReached: false,
      repeatable: false,
      countsAsNewCard: true,
    });
    expect(result.state.cardStates.surv_001).toMatchObject({
      timesReviewed: 1,
      timesCorrect: 1,
      lastReviewDate: today,
    });
    expect(result.state.stats.totalXp).toBe(10);
    expect(result.state.stats.totalCardsLearned).toBe(1);
    expect(result.state.studyDays[today]).toEqual({ cards: 1, reviews: 1 });
    expect(result.state.reviewLog.entries).toHaveLength(1);
  });

  it("reports the daily goal crossing once and offers repeat practice", () => {
    const state = baseState();
    state.settings.dailyGoal = 1;

    const result = applyGradeOutcome(state, "surv_001", "good", {}, at);

    expect(result.outcome.goalJustReached).toBe(true);
    expect(result.outcome.repeatable).toBe(true);
    expect(result.outcome.xp).toBe(10);
  });

  it("keeps XP flowing in weak practice after the daily goal", () => {
    const state = baseState();
    state.settings.dailyGoal = 1;
    state.studyDays[today] = { cards: 1, reviews: 1 };

    const result = applyGradeOutcome(
      state,
      "surv_001",
      "easy",
      { mode: "weak" },
      at
    );

    expect(result.outcome).toMatchObject({
      xp: 15,
      goalJustReached: false,
      repeatable: true,
    });
  });

  it("logs practice-only shadowing without moving progress", () => {
    const state = baseState();

    const result = applyGradeOutcome(
      state,
      "surv_001",
      "good",
      { mode: "shadowing" },
      at
    );

    expect(result.outcome).toEqual({
      xp: 0,
      goalJustReached: false,
      repeatable: false,
      countsAsNewCard: false,
    });
    expect(result.state.cardStates).toEqual(state.cardStates);
    expect(result.state.stats).toEqual(state.stats);
    expect(result.state.studyDays).toEqual(state.studyDays);
    expect(result.state.reviewLog.entries).toHaveLength(1);
    expect(result.state.reviewLog.entries[0]).toMatchObject({
      mode: "shadowing",
      rating: "good",
    });
  });

  it("does not pay twice for a same-day re-grade", () => {
    const first = applyGradeOutcome(baseState(), "surv_001", "good", {}, at);
    const second = applyGradeOutcome(first.state, "surv_001", "good", {}, at);

    expect(second.outcome).toMatchObject({
      xp: 0,
      goalJustReached: false,
      countsAsNewCard: false,
    });
    expect(second.state.stats.totalXp).toBe(first.state.stats.totalXp);
    expect(second.state.studyDays[today]).toEqual({ cards: 1, reviews: 1 });
  });
});

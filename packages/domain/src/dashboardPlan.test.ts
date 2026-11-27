import { describe, expect, it } from "vitest";
import type { VocabularyCard } from "@domain/vocabulary";
import {
  RECOGNITION_MIN_CARDS,
  buildModeAvailability,
  buildTodayPlan,
  type TodayPlanInput,
} from "./dashboardPlan";

function card(id: string): VocabularyCard {
  return {
    id,
    front: id,
    back: `${id} meaning`,
    romanization: id,
    tag: "survival",
    example: `${id} example`,
    difficulty: "beginner",
    partOfSpeech: "noun",
  };
}

function cards(count: number, prefix = "c"): VocabularyCard[] {
  return Array.from({ length: count }, (_, i) => card(`${prefix}${i}`));
}

function plan(overrides: Partial<TodayPlanInput> = {}) {
  return buildTodayPlan({
    queue: [],
    newCards: 0,
    cardsRemaining: 5,
    overdueCount: 0,
    firstRun: false,
    dailyGoalReached: false,
    studied: 0,
    dailyGoal: 10,
    ...overrides,
  });
}

describe("today's plan wording", () => {
  it("says scheduled reviews are complete when 0 cards are planned but the goal is not met", () => {
    expect(plan({ queue: [] }).summary).toBe(
      "Today's scheduled reviews are complete. New words resume tomorrow."
    );
  });

  it("uses the singular for 1 planned card", () => {
    expect(plan({ queue: cards(1) }).summary).toBe("1 card planned for today");
  });

  it("uses the plural for several planned cards", () => {
    expect(plan({ queue: cards(3) }).summary).toBe("3 cards planned for today");
  });

  it("uses the plural for several overdue reviews", () => {
    expect(plan({ queue: cards(4), overdueCount: 2 }).summary).toBe(
      "2 reviews due · 4 cards planned for today"
    );
  });

  it("leaves out the due part when nothing is overdue", () => {
    expect(plan({ queue: cards(2), overdueCount: 0 }).summary).not.toContain(
      "due"
    );
  });

  it("switches to the goal-reached line when no cards remain, whatever is queued", () => {
    expect(plan({ queue: cards(2), cardsRemaining: 0 }).summary).toBe(
      "You've hit today's goal. Extra practice is optional from here."
    );
  });

  it("counts a queued card as planned work only until the goal is reached", () => {
    const open = plan({ queue: cards(3), studied: 1 });
    const reached = plan({
      queue: cards(3),
      studied: 1,
      dailyGoalReached: true,
      cardsRemaining: 0,
    });

    expect(open.progress.planned).toBe(4);
    expect(reached.progress.planned).toBe(1);
    expect(reached.plannedCards).toBe(3);
  });
});

describe("mode availability thresholds", () => {
  const ids = (pool: VocabularyCard[]) => pool.map(c => c.id);

  function modes(recognitionCount: number, scenarioIds: string[] = ["c0"]) {
    const recognition = cards(recognitionCount);
    return buildModeAvailability([], recognition, [], [], [], scenarioIds);
  }

  it("names the recognition threshold as 4 reviewed cards", () => {
    expect(RECOGNITION_MIN_CARDS).toBe(4);
  });

  it("gates listening at RECOGNITION_MIN_CARDS − 1, =, and +1", () => {
    expect(modes(RECOGNITION_MIN_CARDS - 1).listening).toEqual({
      available: false,
      reason: "too-few-reviewed-cards",
    });
    expect(modes(RECOGNITION_MIN_CARDS).listening).toEqual({
      available: true,
      reason: null,
    });
    expect(modes(RECOGNITION_MIN_CARDS + 1).listening.available).toBe(true);
  });

  it("gates scenario on the same threshold, reporting the card shortage before the scenario shortage", () => {
    // No scenario card survived either way, so the reason shows which gate bit.
    expect(modes(RECOGNITION_MIN_CARDS - 1, []).scenario.reason).toBe(
      "too-few-reviewed-cards"
    );
    expect(modes(RECOGNITION_MIN_CARDS, []).scenario.reason).toBe(
      "no-scenarios"
    );
    expect(modes(RECOGNITION_MIN_CARDS + 1, ["c0"]).scenario).toEqual({
      available: true,
      reason: null,
    });
  });

  it("needs the scenario card itself to be in the recognition pool", () => {
    expect(modes(RECOGNITION_MIN_CARDS, ["elsewhere"]).scenario.reason).toBe(
      "no-scenarios"
    );
    expect(
      modes(RECOGNITION_MIN_CARDS, ["elsewhere", "c3"]).scenario.available
    ).toBe(true);
  });

  it("opens each pool-based mode at exactly 1 card and keeps it closed at 0", () => {
    const empty = buildModeAvailability([], [], [], [], [], []);
    const one = buildModeAvailability(
      cards(1, "q"),
      [],
      cards(1, "w"),
      cards(1, "l"),
      cards(1, "s"),
      []
    );

    for (const mode of ["daily", "weak", "learning", "shadowing"] as const) {
      expect(empty[mode], mode).toEqual({ available: false, reason: "empty" });
      expect(one[mode], mode).toEqual({ available: true, reason: null });
    }
    expect(ids(cards(1, "q"))).toEqual(["q0"]);
  });
});

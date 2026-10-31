import { describe, it, expect } from "vitest";
import type { CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";
import {
  buildDailyQueue,
  buildReviewForecast,
  countOverdue,
  nextScheduledReview,
  selectLearningCards,
  selectWeakCards,
  summarizeForecast,
} from "./queue";

const today = "2026-10-31";

function card(id: string): VocabularyCard {
  return {
    id,
    front: id,
    back: id,
    romanization: id,
    tag: "essential",
    example: "",
    difficulty: "beginner",
    partOfSpeech: "noun",
  };
}

function state(id: string, overrides: Partial<CardState> = {}): CardState {
  return {
    id,
    due: "2026-11-05",
    interval: 5,
    timesReviewed: 1,
    timesCorrect: 1,
    lastReviewDate: "2026-10-30",
    ...overrides,
  };
}

describe("buildDailyQueue", () => {
  const cards = ["a", "b", "c", "d", "e"].map(card);

  it("orders due cards by the oldest due date", () => {
    const states = {
      a: state("a", { due: "2026-10-29" }),
      b: state("b", { due: "2026-10-27" }),
      c: state("c", { due: "2026-10-31" }),
    };
    expect(
      buildDailyQueue(cards, states, today, 10, 0, 0).map(item => item.id)
    ).toEqual(["b", "a", "c"]);
  });

  it("includes due reviews and leaves not-yet-due reviews for later", () => {
    const states = {
      a: state("a", { due: "2026-11-05", timesReviewed: 2, timesCorrect: 1 }),
      b: state("b", {
        due: "2026-11-05",
        timesReviewed: 3,
        timesCorrect: 3,
        interval: 10,
        consecutiveCorrect: 2,
      }),
      c: state("c", {
        due: "2026-11-05",
        lastReviewDate: today,
        timesReviewed: 2,
        timesCorrect: 1,
      }),
      d: state("d", { due: "2026-10-30" }),
    };
    expect(
      buildDailyQueue(cards, states, today, 10, 0, 0).map(item => item.id)
    ).toEqual(["d"]);
  });

  it("adds the newest cards up to the per-day cap", () => {
    const fresh = [card("a"), card("b"), card("c"), card("d"), card("e")];
    expect(
      buildDailyQueue(fresh, {}, today, 10, 0).map(item => item.id)
    ).toEqual(["a", "b", "c"]);
    expect(
      buildDailyQueue(fresh, {}, today, 10, 0, 5).map(item => item.id)
    ).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("introduces new cards in beginner theme order", () => {
    const themed = [
      { ...card("essential_1"), tag: "essential" },
      { ...card("food_1"), tag: "food" },
      { ...card("survival_1"), tag: "survival" },
      { ...card("daily_1"), tag: "daily" },
    ];
    expect(
      buildDailyQueue(themed, {}, today, 10, 0, 3).map(item => item.id)
    ).toEqual(["survival_1", "daily_1", "food_1"]);
  });

  it("never repeats a card and respects the cards left in the goal", () => {
    const states = {
      a: state("a", { due: "2026-10-30" }),
      b: state("b", { due: "2026-11-05", timesReviewed: 2, timesCorrect: 1 }),
    };
    const queue = buildDailyQueue(cards, states, today, 4, 0, 3);
    const ids = queue.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(queue).toHaveLength(4);
    expect(ids[0]).toBe("a");
    expect(ids).not.toContain("b");
  });

  it("slices to the cards left in the daily goal", () => {
    const states = {
      a: state("a", { due: "2026-10-30" }),
      b: state("b", { due: "2026-10-29" }),
    };
    expect(
      buildDailyQueue(cards, states, today, 4, 3, 3).map(item => item.id)
    ).toEqual(["b"]);
  });

  it("returns a repeat queue once the daily goal is reached", () => {
    const states = {
      a: state("a", { due: "2026-10-30", lastReviewDate: today }),
    };
    expect(
      buildDailyQueue(cards, states, today, 2, 2, 0).map(item => item.id)
    ).toEqual(["a"]);
  });
});

describe("weak and learning selections", () => {
  const cards = ["a", "b", "c", "d"].map(card);

  it("orders weak cards by accuracy and prefers cards not reviewed today", () => {
    const states = {
      a: state("a", { timesReviewed: 4, timesCorrect: 1 }),
      b: state("b", { timesReviewed: 4, timesCorrect: 3 }),
      c: state("c", {
        timesReviewed: 4,
        timesCorrect: 0,
        lastReviewDate: today,
      }),
      d: state("d", {
        timesReviewed: 2,
        timesCorrect: 2,
        interval: 10,
        consecutiveCorrect: 2,
      }),
    };
    expect(selectWeakCards(cards, states, today).map(item => item.id)).toEqual([
      "a",
      "b",
      "d",
    ]);
  });

  it("selects learning and shaky cards by due date", () => {
    const states = {
      a: state("a", {
        timesReviewed: 3,
        timesCorrect: 3,
        interval: 10,
        consecutiveCorrect: 2,
        due: "2026-11-09",
      }),
      b: state("b", { timesReviewed: 1, due: "2026-11-01" }),
      c: state("c", { timesReviewed: 2, timesCorrect: 2, due: "2026-11-02" }),
    };
    expect(
      selectLearningCards(cards, states, today).map(item => item.id)
    ).toEqual(["b", "c"]);
  });
});

describe("workload", () => {
  const cards = ["a", "b", "c", "d"].map(card);
  const states = {
    a: state("a", { due: "2026-10-29" }),
    b: state("b", { due: "2026-10-31" }),
    c: state("c", { due: "2026-11-02" }),
  };

  it("counts overdue cards", () => {
    expect(countOverdue(cards, states, today)).toBe(2);
  });

  it("builds the short forecast with overdue work on the first day", () => {
    expect(
      buildReviewForecast(cards, states, today, 7, {
        overdueOnFirstDay: true,
      }).map(day => day.count)
    ).toEqual([2, 0, 1, 0, 0, 0, 0]);
  });

  it("counts only today's scheduled work in the 30-day outlook", () => {
    const forecast = buildReviewForecast(cards, states, today, 30);
    expect(forecast[0].count).toBe(1);
    expect(forecast[2].count).toBe(1);
    expect(summarizeForecast(forecast, 10).total).toBe(2);
  });

  it("summarizes the peak and workload status", () => {
    expect(
      summarizeForecast(
        [
          { key: "a", count: 1 },
          { key: "b", count: 4 },
        ],
        10
      )
    ).toMatchObject({
      total: 5,
      peak: { key: "b", count: 4 },
      status: "balanced",
    });
    expect(summarizeForecast([{ key: "a", count: 4 }], 3).status).toBe("busy");
    expect(summarizeForecast([{ key: "a", count: 6 }], 3).status).toBe("heavy");
  });

  it("finds the next scheduled review after today", () => {
    expect(nextScheduledReview(states, today)).toBe("2026-11-02");
    expect(nextScheduledReview({}, today)).toBeUndefined();
  });
});

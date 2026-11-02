import { describe, it, expect } from "vitest";
import type { CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";
import {
  accuracy,
  buildDailyQueue,
  buildReviewForecast,
  countOverdue,
  nextScheduledReview,
  selectLearningCards,
  selectRecognitionCards,
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
    tag: "daily",
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

  it("counts cards introduced today against the new-card pace", () => {
    const states = {
      a: state("a", { lastReviewDate: today, timesReviewed: 1 }),
      b: state("b", { lastReviewDate: today, timesReviewed: 1 }),
    };
    expect(
      buildDailyQueue(cards, states, today, 10, 0, 3).map(item => item.id)
    ).toEqual(["c"]);
  });

  it("stops introducing new cards once the daily pace is spent", () => {
    const states = {
      a: state("a", { lastReviewDate: today, timesReviewed: 1 }),
      b: state("b", { lastReviewDate: today, timesReviewed: 1 }),
      c: state("c", { lastReviewDate: today, timesReviewed: 1 }),
    };
    expect(
      buildDailyQueue(cards, states, today, 10, 0, 3).map(item => item.id)
    ).toEqual([]);
  });

  it("keeps unseen cards out of the repeat queue after the goal", () => {
    const states = {
      a: state("a", { due: "2026-10-30", lastReviewDate: today }),
    };
    expect(
      buildDailyQueue(cards, states, today, 2, 2, 5).map(item => item.id)
    ).toEqual(["a"]);
  });

  it("introduces new cards in beginner theme order", () => {
    const themed = [
      { ...card("unthemed_1"), tag: "unthemed" },
      { ...card("food_1"), tag: "food" },
      { ...card("survival_1"), tag: "survival" },
      { ...card("daily_1"), tag: "daily" },
    ];
    expect(
      buildDailyQueue(themed, {}, today, 10, 0, 3).map(item => item.id)
    ).toEqual(["survival_1", "daily_1", "food_1"]);
  });

  it("orders imported cards by frequency inside a theme, after curated ones", () => {
    const themed = [
      { ...card("food_common"), tag: "food", frequencyRank: 2 },
      { ...card("food_rare"), tag: "food", frequencyRank: 40 },
      { ...card("food_curated"), tag: "food" },
    ];
    expect(
      buildDailyQueue(themed, {}, today, 10, 0, 3).map(item => item.id)
    ).toEqual(["food_curated", "food_common", "food_rare"]);
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

describe("recognition selection", () => {
  const cards = ["a", "b", "c", "d", "e"].map(card);
  const ids = (selection: VocabularyCard[]) => selection.map(item => item.id);
  const known = (id: string, overrides: Partial<CardState> = {}) =>
    state(id, {
      timesReviewed: 4,
      timesCorrect: 4,
      interval: 10,
      consecutiveCorrect: 2,
      ...overrides,
    });

  it("returns nothing until a card has been reviewed", () => {
    expect(ids(selectRecognitionCards([], {}, today))).toEqual([]);
    expect(ids(selectRecognitionCards(cards, {}, today))).toEqual([]);

    const unreviewed = {
      a: state("a", { timesReviewed: 0, timesCorrect: 0, due: today }),
    };
    expect(ids(selectRecognitionCards(cards, unreviewed, today))).toEqual([]);
  });

  it("omits new cards while keeping every reviewed card", () => {
    const states = {
      a: state("a"),
      b: state("b", { timesReviewed: 0, timesCorrect: 0, due: today }),
      c: state("c", { timesReviewed: 2, timesCorrect: 2 }),
    };
    expect(ids(selectRecognitionCards(cards, states, today))).toEqual([
      "a",
      "c",
    ]);
  });

  it("puts due reviews first, oldest due date first", () => {
    const states = {
      a: state("a", { due: "2026-10-30" }),
      b: state("b", { due: "2026-10-28" }),
      c: state("c", { due: today }),
      d: known("d"),
    };
    expect(ids(selectRecognitionCards(cards, states, today))).toEqual([
      "b",
      "a",
      "c",
      "d",
    ]);
  });

  it("orders not-due learning and shaky cards by accuracy", () => {
    const states = {
      a: state("a", { timesReviewed: 4, timesCorrect: 3 }),
      b: state("b", { timesReviewed: 4, timesCorrect: 1 }),
      c: state("c", { timesReviewed: 2, timesCorrect: 1 }),
      d: known("d"),
    };
    expect(ids(selectRecognitionCards(cards, states, today))).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("keeps deck order for accuracy ties instead of review count", () => {
    const pair = [card("b"), card("a")];
    const states = {
      b: state("b", { timesReviewed: 2, timesCorrect: 1 }),
      a: state("a", { timesReviewed: 4, timesCorrect: 2 }),
    };
    expect(ids(selectRecognitionCards(pair, states, today))).toEqual([
      "b",
      "a",
    ]);
    // Weak Words breaks the same tie by review count.
    expect(ids(selectWeakCards(pair, states, today))).toEqual(["a", "b"]);
  });

  it("keeps the known remainder last in deck order", () => {
    const states = {
      a: known("a"),
      b: known("b"),
      c: state("c", { timesReviewed: 4, timesCorrect: 1 }),
    };
    expect(
      ids(selectRecognitionCards(cards.slice(0, 3), states, today))
    ).toEqual(["c", "a", "b"]);
  });

  it("keeps a due card in front even when it is known", () => {
    const states = {
      a: known("a", { due: "2026-10-29" }),
      b: state("b", { timesReviewed: 4, timesCorrect: 1 }),
    };
    expect(
      ids(selectRecognitionCards(cards.slice(0, 2), states, today))
    ).toEqual(["a", "b"]);
  });

  it("keeps deck order for cards due on the same day", () => {
    const pair = [card("b"), card("a")];
    const states = {
      b: state("b", { due: today }),
      a: state("a", { due: today }),
    };
    expect(ids(selectRecognitionCards(pair, states, today))).toEqual([
      "b",
      "a",
    ]);
  });

  it("preserves duplicate deck entries", () => {
    const duplicated = [card("a"), card("a"), card("b")];
    const states = {
      a: state("a", { timesReviewed: 2, timesCorrect: 1 }),
      b: state("b", { timesReviewed: 4, timesCorrect: 1 }),
    };
    expect(ids(selectRecognitionCards(duplicated, states, today))).toEqual([
      "b",
      "a",
      "a",
    ]);
  });

  it("ignores saved states for cards no longer in the deck", () => {
    const states = {
      a: state("a"),
      removed: state("removed", { due: "2026-10-01" }),
    };
    expect(ids(selectRecognitionCards([card("a")], states, today))).toEqual([
      "a",
    ]);
  });

  it("keeps every reviewed card without applying a limit", () => {
    const states = Object.fromEntries(
      cards.map(item => [
        item.id,
        state(item.id, { timesReviewed: 4, timesCorrect: 1 }),
      ])
    );
    expect(selectRecognitionCards(cards, states, today)).toHaveLength(5);
  });

  it("does not skip cards already reviewed today", () => {
    const pair = [card("a"), card("b")];
    const states = {
      a: state("a", {
        timesReviewed: 4,
        timesCorrect: 1,
        lastReviewDate: today,
      }),
      b: state("b", { timesReviewed: 4, timesCorrect: 3 }),
    };
    expect(ids(selectRecognitionCards(pair, states, today))).toEqual([
      "a",
      "b",
    ]);
    // Weak Words prefers the card not reviewed today.
    expect(ids(selectWeakCards(pair, states, today))).toEqual(["b"]);
  });
});

describe("accuracy", () => {
  it("falls back to zero for a missing state", () => {
    expect(accuracy(undefined)).toBe(0);
  });

  it("reports correct reviews over reviews", () => {
    expect(accuracy(state("a", { timesReviewed: 4, timesCorrect: 1 }))).toBe(
      0.25
    );
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
    expect(nextScheduledReview(states, cards, today)).toBe("2026-11-02");
    expect(nextScheduledReview({}, cards, today)).toBeUndefined();
  });

  it("ignores saved states for cards no longer in the deck", () => {
    const withRemoved = {
      ...states,
      removed: state("removed", { due: "2026-11-01" }),
    };
    expect(nextScheduledReview(withRemoved, cards, today)).toBe("2026-11-02");
    expect(nextScheduledReview(withRemoved, [], today)).toBeUndefined();
  });
});

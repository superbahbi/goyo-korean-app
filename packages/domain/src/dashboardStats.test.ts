import { describe, expect, it } from "vitest";
import type { CardState } from "@domain/mastery";
import type { VocabularyCard } from "@domain/vocabulary";
import { buildDashboardStats } from "./dashboardStats";

function card(id: string, tag = "survival"): VocabularyCard {
  return {
    id,
    front: id,
    back: `${id} meaning`,
    romanization: id,
    tag,
    example: `${id} example`,
    difficulty: "beginner",
    partOfSpeech: "noun",
  };
}

function state(id: string, overrides: Partial<CardState> = {}): CardState {
  return {
    id,
    due: "2026-11-01",
    interval: 2,
    timesReviewed: 1,
    timesCorrect: 1,
    lastReviewDate: "2026-10-30",
    ...overrides,
  };
}

/** Cards a..n, each reviewed once with the given response times (undefined = none). */
function withTimes(times: (number | undefined)[]) {
  const cards = times.map((_, i) => card(`c${i}`));
  const cardStates = Object.fromEntries(
    cards.map((c, i) => [c.id, state(c.id, { lastResponseTimeMs: times[i] })])
  );
  return buildDashboardStats(cards, cardStates).reviewStats;
}

describe("review accuracy", () => {
  it("is 0 with no reviews, never NaN or a division by zero", () => {
    const cards = [card("a"), card("b")];
    const { reviewStats } = buildDashboardStats(cards, {});

    expect(reviewStats.totalReviews).toBe(0);
    expect(reviewStats.overallAccuracy).toBe(0);
    expect(Number.isNaN(reviewStats.overallAccuracy)).toBe(false);
  });

  it("is 0 for an empty deck", () => {
    const { reviewStats, categories } = buildDashboardStats([], {});

    expect(reviewStats).toEqual({
      totalReviews: 0,
      overallAccuracy: 0,
      medianResponseTime: null,
    });
    expect(categories.every(c => c.total === 0 && c.coverage === 0)).toBe(true);
  });

  it("ignores card states with timesReviewed 0 and states for cards not in the deck", () => {
    const cards = [card("a")];
    const { reviewStats } = buildDashboardStats(cards, {
      a: state("a", { timesReviewed: 0, timesCorrect: 0 }),
      ghost: state("ghost", { timesReviewed: 9, timesCorrect: 9 }),
    });

    expect(reviewStats.totalReviews).toBe(0);
    expect(reviewStats.overallAccuracy).toBe(0);
  });

  it("is the rounded share of correct answers across all reviews", () => {
    const cards = [card("a"), card("b")];
    const { reviewStats } = buildDashboardStats(cards, {
      a: state("a", { timesReviewed: 2, timesCorrect: 1 }),
      b: state("b", { timesReviewed: 1, timesCorrect: 1 }),
    });

    expect(reviewStats.totalReviews).toBe(3);
    expect(reviewStats.overallAccuracy).toBe(67);
  });

  it("reports a category accuracy of null until one of its cards is reviewed", () => {
    const { categories } = buildDashboardStats([card("a")], {});

    expect(categories.find(c => c.id === "survival")?.accuracy).toBeNull();
  });
});

describe("median response time", () => {
  it("is null when no card has a response time", () => {
    expect(withTimes([undefined, undefined]).medianResponseTime).toBeNull();
    expect(withTimes([]).medianResponseTime).toBeNull();
  });

  it("is the middle value for an odd count, however the times are ordered", () => {
    expect(withTimes([900, 100, 500]).medianResponseTime).toBe(500);
  });

  it("picks the UPPER middle value for an even count (index floor(n/2), no averaging)", () => {
    expect(withTimes([400, 100, 300, 200]).medianResponseTime).toBe(300);
    expect(withTimes([100, 200]).medianResponseTime).toBe(200);
  });

  it("is the only value when there is one", () => {
    expect(withTimes([750]).medianResponseTime).toBe(750);
  });

  it("skips entries without a response time and entries of 0 or less", () => {
    expect(
      withTimes([undefined, 0, -5, 100, 300, 200]).medianResponseTime
    ).toBe(200);
  });

  it("only counts reviewed cards", () => {
    const cards = [card("a"), card("b")];
    const { reviewStats } = buildDashboardStats(cards, {
      a: state("a", { lastResponseTimeMs: 400 }),
      b: state("b", {
        timesReviewed: 0,
        timesCorrect: 0,
        lastResponseTimeMs: 9000,
      }),
    });

    expect(reviewStats.medianResponseTime).toBe(400);
  });
});

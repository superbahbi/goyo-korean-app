import { describe, expect, it } from "vitest";
import type { CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";
import {
  buildDashboardView,
  RECOGNITION_MIN_CARDS,
  type DashboardViewInput,
} from "./dashboardView";

const today = "2026-11-01";

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
    due: today,
    interval: 2,
    timesReviewed: 2,
    timesCorrect: 2,
    lastReviewDate: "2026-10-30",
    ...overrides,
  };
}

function input(
  overrides: Partial<DashboardViewInput> = {}
): DashboardViewInput {
  return {
    vocabulary: [],
    studyReady: [],
    cardStates: {},
    studyDays: {},
    reviewEntries: 0,
    today,
    dailyGoal: 10,
    newCardsPerDay: 3,
    level: 1,
    totalXp: 0,
    streak: 0,
    scenarioCardIds: ["surv_001"],
    labelDate: (_key, style) => (style === "weekday" ? "WD" : "MD"),
    ...overrides,
  };
}

describe("mode availability", () => {
  it("requires enough reviewed cards for recognition practice", () => {
    const cards = Array.from(
      { length: RECOGNITION_MIN_CARDS - 1 },
      (_, index) => card(`card_${index}`)
    );
    const cardStates = Object.fromEntries(
      cards.map(item => [item.id, state(item.id)])
    );

    const view = buildDashboardView(
      input({ studyReady: cards, vocabulary: cards, cardStates })
    );

    expect(view.modes.listening).toEqual({
      available: false,
      reason: "too-few-reviewed-cards",
    });
    expect(view.modes.scenario.reason).toBe("too-few-reviewed-cards");
  });

  it("passes the card gate but reports a scenario with no surviving cards", () => {
    const cards = Array.from({ length: RECOGNITION_MIN_CARDS }, (_, index) =>
      card(`card_${index}`)
    );
    const cardStates = Object.fromEntries(
      cards.map(item => [item.id, state(item.id)])
    );

    const view = buildDashboardView(
      input({
        studyReady: cards,
        vocabulary: cards,
        cardStates,
        scenarioCardIds: ["surv_001"],
      })
    );

    expect(view.modes.listening.available).toBe(true);
    expect(view.modes.scenario).toEqual({
      available: false,
      reason: "no-scenarios",
    });
  });

  it("makes scenario practice available when a scenario card survived", () => {
    const cards = Array.from({ length: RECOGNITION_MIN_CARDS }, (_, index) =>
      card(index === 0 ? "surv_001" : `card_${index}`)
    );
    const cardStates = Object.fromEntries(
      cards.map(item => [item.id, state(item.id)])
    );

    const view = buildDashboardView(
      input({
        studyReady: cards,
        vocabulary: cards,
        cardStates,
        scenarioCardIds: ["surv_001"],
      })
    );

    expect(view.modes.scenario.available).toBe(true);
  });

  it("reports daily, weak, learning, and shadowing from their own pools", () => {
    const reviewed = card("surv_001");
    const learning = card("daily_001", "daily");
    const view = buildDashboardView(
      input({
        studyReady: [reviewed, learning],
        vocabulary: [reviewed, learning],
        cardStates: {
          surv_001: state("surv_001", {
            timesReviewed: 2,
            timesCorrect: 2,
            interval: 2,
          }),
          daily_001: state("daily_001", {
            timesReviewed: 1,
            timesCorrect: 1,
          }),
        },
      })
    );

    expect(view.modes.daily.available).toBe(true);
    expect(view.modes.weak.available).toBe(true);
    expect(view.modes.learning.available).toBe(true);
    expect(view.modes.shadowing.available).toBe(true);
  });
});

describe("category summaries", () => {
  it("emits one shape for the grid and the stats dialog", () => {
    const survival = card("surv_001");
    const view = buildDashboardView(
      input({
        vocabulary: [survival],
        studyReady: [survival],
        cardStates: {
          surv_001: state("surv_001", {
            timesReviewed: 3,
            timesCorrect: 3,
            interval: 9,
            consecutiveCorrect: 2,
          }),
        },
      })
    );

    expect(view.stats.categories[0]).toMatchObject({
      id: "survival",
      name: "Survival",
      reviewed: 1,
      total: 1,
      accuracy: 100,
      known: 1,
      coverage: 100,
    });
    expect(view.dialog.stats.categories).toBe(view.stats.categories);
  });
});

describe("forecast payload", () => {
  it("uses the injected label policy and summarizes the 30-day outlook", () => {
    const item = card("surv_001");
    const view = buildDashboardView(
      input({
        vocabulary: [item],
        studyReady: [item],
        cardStates: { surv_001: state("surv_001", { due: today }) },
      })
    );

    expect(view.review.forecast[0].label).toBe("Today");
    expect(view.review.forecast[1].label).toBe("Tmrw");
    expect(view.review.forecast[2].label).toBe("WD");
    expect(view.review.extendedForecast[0].label).toBe("MD");
    expect(view.dialog.forecast.days).toBe(view.review.extendedForecast);
    expect(view.review.total).toBe(1);
    expect(view.review.peak.count).toBe(1);
  });
});

describe("first run and today's plan", () => {
  it("keeps a fresh learner in first-run mode with no mode available", () => {
    const view = buildDashboardView(input());

    expect(view.today.firstRun).toBe(true);
    expect(view.today.plan.firstRun).toBe(true);
    expect(view.today.plan.plannedCards).toBe(0);
    expect(Object.values(view.modes).every(mode => !mode.available)).toBe(true);
  });

  it("treats saved card states as history even without a review log", () => {
    const item = card("surv_001");
    const view = buildDashboardView(
      input({
        vocabulary: [item],
        studyReady: [item],
        cardStates: { surv_001: state("surv_001") },
      })
    );

    expect(view.today.firstRun).toBe(false);
  });

  it("builds the hero summary from the plan it also exposes", () => {
    const item = card("surv_001");
    const view = buildDashboardView(
      input({
        vocabulary: [item],
        studyReady: [item],
        cardStates: { surv_001: state("surv_001", { due: "2026-10-30" }) },
        dailyGoal: 3,
      })
    );

    expect(view.today.plan).toMatchObject({
      plannedCards: 1,
      overdueCount: 1,
      cardsRemaining: 3,
      summary: "1 review due · 1 card planned for today",
    });
  });

  it("switches the summary once the daily goal is reached", () => {
    const item = card("surv_001");
    const view = buildDashboardView(
      input({
        vocabulary: [item],
        studyReady: [item],
        cardStates: { surv_001: state("surv_001", { due: "2026-10-30" }) },
        studyDays: { [today]: { cards: 3, reviews: 3 } },
        dailyGoal: 3,
      })
    );

    expect(view.today.dailyGoalReached).toBe(true);
    expect(view.today.plan.summary).toBe(
      "You've hit today's goal. Extra practice is optional from here."
    );
  });
});

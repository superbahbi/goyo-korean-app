import { describe, it, expect } from "vitest";
import {
  daysStudiedWithin,
  deriveStreak,
  migrateLegacyDay,
  recordStudyDay,
  reviewsWithin,
  sanitizeStudyDays,
  type StudyDays,
} from "./studyDays";

describe("recordStudyDay", () => {
  it("counts the first card of the day and an accepted review", () => {
    const days = recordStudyDay({}, "2026-10-31", {
      cardFirstSeenToday: true,
      scheduleAdvanced: true,
    });
    expect(days).toEqual({ "2026-10-31": { cards: 1, reviews: 1 } });
  });

  it("counts a second card but not a same-day re-grade", () => {
    const days: StudyDays = { "2026-10-31": { cards: 1, reviews: 1 } };
    expect(
      recordStudyDay(days, "2026-10-31", {
        cardFirstSeenToday: true,
        scheduleAdvanced: true,
      })
    ).toEqual({
      "2026-10-31": { cards: 2, reviews: 2 },
    });
    expect(
      recordStudyDay(days, "2026-10-31", {
        cardFirstSeenToday: false,
        scheduleAdvanced: false,
      })
    ).toBe(days);
  });
});

describe("sanitizeStudyDays", () => {
  it("returns an empty history for malformed values", () => {
    expect(sanitizeStudyDays(undefined)).toEqual({});
    expect(sanitizeStudyDays([])).toEqual({});
    expect(sanitizeStudyDays("2026-10-31")).toEqual({});
  });

  it("keeps valid days and drops invalid keys and counts", () => {
    const days = sanitizeStudyDays({
      "2026-10-31": { cards: 2, reviews: 3 },
      "not-a-day": { cards: 1, reviews: 1 },
      "2026-10-30": { cards: 4, reviews: 1 },
      "2026-10-29": { cards: 0, reviews: 0 },
      "2026-10-28": "nope",
    });
    expect(days).toEqual({
      "2026-10-31": { cards: 2, reviews: 3 },
      "2026-10-30": { cards: 1, reviews: 1 },
    });
  });
});

describe("deriveStreak", () => {
  const days: StudyDays = {
    "2026-10-31": { cards: 1, reviews: 1 },
    "2026-10-30": { cards: 1, reviews: 1 },
    "2026-10-29": { cards: 1, reviews: 1 },
    "2026-10-26": { cards: 1, reviews: 1 },
  };

  it("counts consecutive days ending today", () => {
    expect(deriveStreak(days, "2026-10-31")).toBe(3);
  });

  it("keeps a streak alive before today's first grade", () => {
    expect(deriveStreak(days, "2026-11-01")).toBe(3);
  });

  it("returns zero after a missed day", () => {
    expect(deriveStreak(days, "2026-11-02")).toBe(0);
  });
});

describe("daysStudiedWithin", () => {
  const days: StudyDays = {
    "2026-10-31": { cards: 1, reviews: 1 },
    "2026-10-25": { cards: 1, reviews: 1 },
    "2026-10-02": { cards: 1, reviews: 1 },
  };

  it("counts the inclusive 7- and 30-day windows", () => {
    expect(daysStudiedWithin(days, "2026-10-31", 7)).toBe(2);
    expect(daysStudiedWithin(days, "2026-10-31", 30)).toBe(3);
  });

  it("ignores future days", () => {
    expect(daysStudiedWithin(days, "2026-10-24", 7)).toBe(0);
  });
});

describe("reviewsWithin", () => {
  const days: StudyDays = {
    "2026-10-31": { cards: 1, reviews: 3 },
    "2026-10-25": { cards: 1, reviews: 2 },
    "2026-10-02": { cards: 1, reviews: 4 },
  };

  it("sums accepted reviews in the inclusive window", () => {
    expect(reviewsWithin(days, "2026-10-31", 7)).toBe(5);
    expect(reviewsWithin(days, "2026-10-31", 30)).toBe(9);
  });

  it("ignores days outside the window", () => {
    expect(reviewsWithin(days, "2026-10-24", 7)).toBe(0);
  });
});

describe("migrateLegacyDay", () => {
  it("folds the v3 counter into the last studied day", () => {
    expect(migrateLegacyDay({}, "2026-10-30", 4)).toEqual({
      "2026-10-30": { cards: 4, reviews: 4 },
    });
  });

  it("does nothing when history already exists or the counter is empty", () => {
    const days: StudyDays = { "2026-10-30": { cards: 1, reviews: 1 } };
    expect(migrateLegacyDay(days, "2026-10-30", 4)).toBe(days);
    expect(migrateLegacyDay({}, "2026-10-30", 0)).toEqual({});
    expect(migrateLegacyDay({}, "", 4)).toEqual({});
  });
});

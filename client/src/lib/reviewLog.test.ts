import { describe, it, expect } from "vitest";
import {
  appendReviewEntry,
  createReviewLog,
  REVIEW_LOG_LIMIT,
  REVIEW_LOG_SCHEMA_VERSION,
  sanitizeReviewLog,
  type ReviewLogEntry,
} from "./reviewLog";

function entry(overrides: Partial<ReviewLogEntry> = {}): ReviewLogEntry {
  return {
    cardId: "surv_001",
    at: "2026-10-30T12:00:00.000Z",
    rating: "good",
    responseTimeMs: 3200,
    mode: "daily",
    ...overrides,
  };
}

describe("review log", () => {
  it("starts empty with the current log schema version", () => {
    expect(createReviewLog()).toEqual({
      schemaVersion: REVIEW_LOG_SCHEMA_VERSION,
      entries: [],
    });
  });

  it("appends grades oldest first", () => {
    const log = appendReviewEntry(
      appendReviewEntry(createReviewLog(), entry({ cardId: "a" })),
      entry({ cardId: "b" })
    );
    expect(log.entries.map(item => item.cardId)).toEqual(["a", "b"]);
  });

  it("drops the oldest entry once the cap is reached", () => {
    let log = createReviewLog();
    for (let index = 0; index <= REVIEW_LOG_LIMIT; index += 1) {
      log = appendReviewEntry(log, entry({ cardId: `card_${index}` }));
    }
    expect(log.entries).toHaveLength(REVIEW_LOG_LIMIT);
    expect(log.entries[0].cardId).toBe("card_1");
    expect(log.entries[log.entries.length - 1].cardId).toBe(
      `card_${REVIEW_LOG_LIMIT}`
    );
  });
});

describe("sanitizeReviewLog", () => {
  it("returns an empty log for missing or malformed values", () => {
    expect(sanitizeReviewLog(undefined)).toEqual(createReviewLog());
    expect(sanitizeReviewLog({ entries: "nope" })).toEqual(createReviewLog());
    expect(sanitizeReviewLog([])).toEqual(createReviewLog());
  });

  it("keeps well-formed entries and drops the rest", () => {
    const log = sanitizeReviewLog({
      schemaVersion: 99,
      entries: [
        entry({ cardId: "kept" }),
        {
          cardId: "",
          at: "2026-10-30T12:00:00.000Z",
          rating: "good",
          mode: "daily",
        },
        { cardId: "bad_date", at: "not a date", rating: "good", mode: "daily" },
        {
          cardId: "bad_rating",
          at: "2026-10-30T12:00:00.000Z",
          rating: "perfect",
          mode: "daily",
        },
        "not an object",
      ],
    });
    expect(log.schemaVersion).toBe(REVIEW_LOG_SCHEMA_VERSION);
    expect(log.entries.map(item => item.cardId)).toEqual(["kept"]);
  });

  it("turns a missing response time into null and an unknown mode into daily", () => {
    const log = sanitizeReviewLog({
      entries: [
        {
          cardId: "a",
          at: "2026-10-30T12:00:00.000Z",
          rating: "again",
          mode: "future_mode",
        },
        {
          cardId: "b",
          at: "2026-10-30T12:00:00.000Z",
          rating: "easy",
          mode: "listening",
          responseTimeMs: 1000,
        },
      ],
    });
    expect(log.entries[0]).toMatchObject({
      responseTimeMs: null,
      mode: "daily",
    });
    expect(log.entries[1]).toMatchObject({
      responseTimeMs: 1000,
      mode: "listening",
    });
  });

  it("caps an imported log at the most recent entries", () => {
    const entries = Array.from({ length: REVIEW_LOG_LIMIT + 5 }, (_, index) =>
      entry({ cardId: `card_${index}` })
    );
    const log = sanitizeReviewLog({ entries });
    expect(log.entries).toHaveLength(REVIEW_LOG_LIMIT);
    expect(log.entries[0].cardId).toBe("card_5");
  });
});

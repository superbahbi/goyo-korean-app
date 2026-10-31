import { describe, it, expect } from "vitest";
import {
  applyGrade,
  buildExportPayload,
  parseSavedState,
  SCHEMA_VERSION,
  validateImportPayload,
} from "./useStudyState";

const card = {
  id: "surv_001",
  due: "2026-11-01",
  interval: 2,
  timesReviewed: 1,
  timesCorrect: 1,
  lastReviewDate: "2026-10-30",
  easeFactor: 2.35,
  consecutiveCorrect: 1,
  lapseCount: 0,
};
const stats = {
  totalXp: 10,
  level: 1,
  streak: 1,
  lastStudyDate: "2026-10-30",
  highestStreak: 1,
  totalCardsLearned: 1,
};
const settings = {
  dailyGoal: 10,
  autoPlayAudio: true,
  audioSpeaker: "elevenlabs",
};
const studyDays = {
  "2026-10-30": { cards: 1, reviews: 1 },
};
const reviewLog = {
  schemaVersion: 1,
  entries: [
    {
      cardId: "surv_001",
      at: "2026-10-30T12:00:00.000Z",
      rating: "good",
      responseTimeMs: 3200,
      mode: "daily",
    },
  ],
};
const today = "2026-10-31";

describe("saved progress schemaVersion", () => {
  it("loads a save without schemaVersion as the current version", () => {
    const state = parseSavedState(JSON.stringify({ cardStates: { surv_001: card }, stats, settings, studyDays }), today);
    expect(SCHEMA_VERSION).toBe(4);
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.cardStates.surv_001).toEqual(card);
    expect(state.stats).toEqual(stats);
    expect(state.settings).toEqual(settings);
    expect(state.studyDays).toEqual(studyDays);
    expect(state.reviewLog).toEqual({ schemaVersion: 1, entries: [] });
  });

  it("treats an older schemaVersion as current without migrating the data", () => {
    const state = parseSavedState(
      JSON.stringify({ schemaVersion: 1, cardStates: { surv_001: card }, stats, settings, studyDays }),
      today,
    );
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.cardStates.surv_001).toEqual(card);
  });

  it("loads a save with the current schemaVersion unchanged", () => {
    const saved = { schemaVersion: SCHEMA_VERSION, cardStates: { surv_001: card }, stats, settings, studyDays, reviewLog };
    expect(parseSavedState(JSON.stringify(saved), today)).toEqual(saved);
  });

  it("starts from the current version when nothing is saved", () => {
    expect(parseSavedState(null).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("drops the removed ttsEnabled setting from older saves", () => {
    const legacySettings = { ...settings, ttsEnabled: false };
    const state = parseSavedState(
      JSON.stringify({ cardStates: { surv_001: card }, stats, settings: legacySettings, studyDays }),
      today,
    );
    expect(state.settings).toEqual(settings);
  });

  it("ignores a legacy box field when loading saved cards", () => {
    const legacyCard = { ...card, box: 1 };
    const state = parseSavedState(
      JSON.stringify({ cardStates: { surv_001: legacyCard }, stats, settings, studyDays }),
      today,
    );
    expect(state.cardStates.surv_001).toEqual(card);
    expect(state.cardStates.surv_001).not.toHaveProperty("box");
  });

  it("folds a v3 cardsStudiedToday counter into a day entry", () => {
    const legacyStats = { ...stats, cardsStudiedToday: 4, streak: 1, highestStreak: 1 };
    const legacy = { schemaVersion: 3, cardStates: { surv_001: card }, stats: legacyStats, settings };
    const state = parseSavedState(JSON.stringify(legacy), today);
    expect(state.studyDays).toEqual({ "2026-10-30": { cards: 4, reviews: 4 } });
    expect(state.stats.streak).toBe(1);
    expect(state.stats).not.toHaveProperty("cardsStudiedToday");
  });
});

describe("study-day history", () => {
  it("derives a streak from the history instead of a stored counter", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: {},
        stats: { ...stats, streak: 99, highestStreak: 120, lastStudyDate: "2026-10-31" },
        settings,
        studyDays: {
          "2026-10-31": { cards: 2, reviews: 3 },
          "2026-10-30": { cards: 1, reviews: 1 },
          "2026-10-29": { cards: 5, reviews: 6 },
          "2026-10-27": { cards: 1, reviews: 1 },
        },
      }),
      today,
    );
    expect(state.stats.streak).toBe(3);
    expect(state.stats.highestStreak).toBe(120);
  });

  it("drops a streak broken by missing days", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      "2026-11-02",
    );
    // The only studied day is three days ago.
    expect(state.stats.streak).toBe(0);
  });

  it("shows yesterday's streak before today's first grade", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      "2026-10-31",
    );
    expect(state.stats.streak).toBe(1);
  });
});

describe("progress export and import", () => {
  const save = { schemaVersion: SCHEMA_VERSION, cardStates: { surv_001: card }, stats, settings, studyDays };

  it("exports the saved shape with an exportedAt timestamp", () => {
    const payload = buildExportPayload(parseSavedState(JSON.stringify(save), today), new Date("2026-10-30T12:00:00Z"));
    expect(payload).toEqual({ ...save, exportedAt: "2026-10-30T12:00:00.000Z" });
  });

  it("leaves the review log out of the export by default", () => {
    const state = parseSavedState(JSON.stringify({ ...save, reviewLog }), today);
    const payload = buildExportPayload(state, new Date("2026-10-30T12:00:00Z"));
    expect(payload).not.toHaveProperty("reviewLog");
  });

  it("includes the review log when asked", () => {
    const state = parseSavedState(JSON.stringify({ ...save, reviewLog }), today);
    const payload = buildExportPayload(state, new Date("2026-10-30T12:00:00Z"), { includeReviewLog: true });
    expect(payload).toEqual({ ...save, reviewLog, exportedAt: "2026-10-30T12:00:00.000Z" });
  });

  it("round-trips an export that includes the review log", () => {
    const state = parseSavedState(JSON.stringify({ ...save, reviewLog }), today);
    const payload = buildExportPayload(state, new Date("2026-10-30T12:00:00Z"), { includeReviewLog: true });
    const result = validateImportPayload(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hasReviewLog).toBe(true);
      expect(result.state.reviewLog).toEqual(reviewLog);
      expect(result.state.studyDays).toEqual(studyDays);
      expect(result.state.stats.streak).toBe(1);
    }
  });

  it("accepts a valid current-version file", () => {
    const result = validateImportPayload(JSON.stringify(save));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.cardStates.surv_001).toEqual(card);
      expect(result.state.stats.streak).toBe(1);
      expect(result.state.settings).toEqual(settings);
      expect(result.exportedAt).toBeNull();
      expect(result.hasReviewLog).toBe(false);
    }
  });

  it("returns the exportedAt value when present", () => {
    const result = validateImportPayload(JSON.stringify({ ...save, exportedAt: "2026-10-30T12:00:00.000Z" }));
    expect(result.ok && result.exportedAt).toBe("2026-10-30T12:00:00.000Z");
  });

  it("accepts a valid older-version file and treats it as current", () => {
    const result = validateImportPayload(JSON.stringify({ ...save, schemaVersion: 1 }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.schemaVersion).toBe(SCHEMA_VERSION);
      expect(result.state.cardStates.surv_001).toEqual(card);
    }
  });

  it("rejects a missing cardStates object", () => {
    const { cardStates: _omitted, ...rest } = save;
    const result = validateImportPayload(JSON.stringify(rest));
    expect(result).toEqual({ ok: false, reason: "The file is missing cardStates (each must be an object)." });
  });

  it("rejects a missing stats object", () => {
    const { stats: _omitted, ...rest } = save;
    const result = validateImportPayload(JSON.stringify(rest));
    expect(result).toEqual({ ok: false, reason: "The file is missing stats (each must be an object)." });
  });

  it("rejects a missing settings object", () => {
    const { settings: _omitted, ...rest } = save;
    const result = validateImportPayload(JSON.stringify(rest));
    expect(result).toEqual({ ok: false, reason: "The file is missing settings (each must be an object)." });
  });

  it("rejects a non-object cardStates value instead of silently defaulting", () => {
    const result = validateImportPayload(JSON.stringify({ cardStates: 5, stats, settings }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("cardStates");
  });

  it("rejects malformed JSON", () => {
    expect(validateImportPayload("{ not json")).toEqual({ ok: false, reason: "The file is not valid JSON." });
  });

  it("rejects a top-level value that is not an object", () => {
    expect(validateImportPayload("[1, 2, 3]").ok).toBe(false);
  });

  it("refuses a file with a newer schemaVersion", () => {
    const result = validateImportPayload(JSON.stringify({ ...save, schemaVersion: SCHEMA_VERSION + 1 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("newer version of Goyo");
  });

  it("rejects a schemaVersion that is not a version number", () => {
    const result = validateImportPayload(JSON.stringify({ ...save, schemaVersion: "two" }));
    expect(result.ok).toBe(false);
  });

  it("accepts an empty cardStates object", () => {
    const result = validateImportPayload(JSON.stringify({ ...save, cardStates: {} }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.cardStates).toEqual({});
  });

  it("ignores extra unknown top-level keys when the required keys are valid", () => {
    const result = validateImportPayload(JSON.stringify({ ...save, extra: { evil: true } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).not.toHaveProperty("extra");
  });
});

describe("applyGrade", () => {
  it("logs one entry per grade with the mode and response time", () => {
    const state = parseSavedState(JSON.stringify({ cardStates: { surv_001: card }, stats, settings, studyDays }), today);
    const at = new Date("2026-10-31T09:30:00.000Z");
    const first = applyGrade(state, "surv_001", "good", { mode: "daily", responseTimeMs: 2500 }, at);
    const second = applyGrade(first, "surv_001", "again", { mode: "weak" }, at);

    expect(second.reviewLog.entries).toHaveLength(2);
    expect(second.reviewLog.entries[0]).toMatchObject({
      cardId: "surv_001",
      rating: "good",
      responseTimeMs: 2500,
      mode: "daily",
      at: "2026-10-31T09:30:00.000Z",
    });
    expect(second.reviewLog.entries[1]).toMatchObject({ rating: "again", responseTimeMs: null, mode: "weak" });
  });

  it("counts a distinct card once per day but every accepted review", () => {
    const state = parseSavedState(JSON.stringify({ cardStates: { surv_001: card }, stats, settings, studyDays }), today);
    const at = new Date("2026-10-31T09:30:00.000Z");
    const first = applyGrade(state, "surv_001", "good", {}, at);
    const second = applyGrade(first, "surv_002", "good", {}, at);

    expect(second.studyDays["2026-10-31"]).toEqual({ cards: 2, reviews: 2 });
    expect(second.stats.streak).toBe(2);
  });

  it("does not count a same-day re-grade as another review", () => {
    const state = parseSavedState(JSON.stringify({ cardStates: { surv_001: card }, stats, settings, studyDays }), today);
    const at = new Date("2026-10-31T09:30:00.000Z");
    const first = applyGrade(state, "surv_001", "good", {}, at);
    const repeat = applyGrade(first, "surv_001", "good", {}, at);

    expect(repeat.studyDays["2026-10-31"]).toEqual({ cards: 1, reviews: 1 });
    expect(repeat.reviewLog.entries).toHaveLength(2);
  });
});

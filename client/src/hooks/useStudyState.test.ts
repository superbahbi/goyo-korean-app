import { describe, it, expect } from "vitest";
import { emptyGrammarProgress } from "@/lib/grammarProgress";
import {
  applyGrade,
  buildExportPayload,
  getSavedSchemaVersion,
  isNewerSave,
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
  newCardsPerDay: 3,
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
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: card },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    expect(SCHEMA_VERSION).toBe(5);
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.cardStates.surv_001).toEqual(card);
    expect(state.stats).toEqual(stats);
    expect(state.settings).toEqual(settings);
    expect(state.studyDays).toEqual(studyDays);
    expect(state.reviewLog).toEqual({ schemaVersion: 1, entries: [] });
  });

  it("treats an older schemaVersion as current without migrating the data", () => {
    const state = parseSavedState(
      JSON.stringify({
        schemaVersion: 1,
        cardStates: { surv_001: card },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.cardStates.surv_001).toEqual(card);
  });

  it("loads a save with the current schemaVersion unchanged", () => {
    const saved = {
      schemaVersion: SCHEMA_VERSION,
      cardStates: { surv_001: card },
      stats,
      settings,
      studyDays,
      reviewLog,
      grammar: emptyGrammarProgress(),
    };
    expect(parseSavedState(JSON.stringify(saved), today)).toEqual(saved);
  });

  it("starts from the current version when nothing is saved", () => {
    expect(parseSavedState(null).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("defaults and clamps the new-card pace", () => {
    const base = { cardStates: {}, stats, studyDays };
    const parsed = (settingsValue: Record<string, unknown>) =>
      parseSavedState(
        JSON.stringify({
          ...base,
          settings: {
            dailyGoal: 10,
            autoPlayAudio: true,
            audioSpeaker: "elevenlabs",
            ...settingsValue,
          },
        }),
        today
      ).settings.newCardsPerDay;

    expect(parsed({})).toBe(3);
    expect(parsed({ newCardsPerDay: 0 })).toBe(1);
    expect(parsed({ newCardsPerDay: 99 })).toBe(10);
    expect(parsed({ newCardsPerDay: 5 })).toBe(5);
  });

  it("derives the level from total XP instead of trusting the saved level", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: {},
        stats: { ...stats, totalXp: 900, level: 99 },
        settings,
        studyDays,
      }),
      today
    );
    expect(state.stats.level).toBe(4);
  });

  it("clamps the daily goal to a whole number between 1 and 100", () => {
    const base = { cardStates: {}, stats, studyDays };
    const parsed = (dailyGoal: unknown) =>
      parseSavedState(
        JSON.stringify({ ...base, settings: { ...settings, dailyGoal } }),
        today
      ).settings.dailyGoal;

    expect(parsed(0)).toBe(1);
    expect(parsed(0.4)).toBe(1);
    expect(parsed(1e9)).toBe(100);
    expect(parsed("10")).toBe(10);
  });

  it("drops the removed ttsEnabled setting from older saves", () => {
    const legacySettings = { ...settings, ttsEnabled: false };
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: card },
        stats,
        settings: legacySettings,
        studyDays,
      }),
      today
    );
    expect(state.settings).toEqual(settings);
  });

  it("ignores a legacy box field when loading saved cards", () => {
    const legacyCard = { ...card, box: 1 };
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: legacyCard },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    expect(state.cardStates.surv_001).toEqual(card);
    expect(state.cardStates.surv_001).not.toHaveProperty("box");
  });

  it("folds a v3 cardsStudiedToday counter into a day entry", () => {
    const legacyStats = {
      ...stats,
      cardsStudiedToday: 4,
      streak: 1,
      highestStreak: 1,
    };
    const legacy = {
      schemaVersion: 3,
      cardStates: { surv_001: card },
      stats: legacyStats,
      settings,
    };
    const state = parseSavedState(JSON.stringify(legacy), today);
    expect(state.studyDays).toEqual({ "2026-10-30": { cards: 4, reviews: 4 } });
    expect(state.stats.streak).toBe(1);
    expect(state.stats).not.toHaveProperty("cardsStudiedToday");
  });
});

describe("saved progress version guard", () => {
  it("reports no version when nothing is saved", () => {
    expect(getSavedSchemaVersion(null)).toBeNull();
    expect(getSavedSchemaVersion("")).toBeNull();
    expect(isNewerSave(null)).toBe(false);
  });

  it("reports no version for malformed saves", () => {
    expect(getSavedSchemaVersion("{ not json")).toBeNull();
    expect(getSavedSchemaVersion("[1, 2, 3]")).toBeNull();
    expect(getSavedSchemaVersion(JSON.stringify({ stats }))).toBeNull();
    expect(
      getSavedSchemaVersion(JSON.stringify({ schemaVersion: "4" }))
    ).toBeNull();
    expect(
      getSavedSchemaVersion(JSON.stringify({ schemaVersion: 3.5 }))
    ).toBeNull();
    expect(isNewerSave("{ not json")).toBe(false);
  });

  it("reads older and current versions without blocking", () => {
    expect(getSavedSchemaVersion(JSON.stringify({ schemaVersion: 1 }))).toBe(1);
    expect(
      getSavedSchemaVersion(JSON.stringify({ schemaVersion: SCHEMA_VERSION }))
    ).toBe(SCHEMA_VERSION);
    expect(isNewerSave(JSON.stringify({ schemaVersion: 1 }))).toBe(false);
    expect(isNewerSave(JSON.stringify({ schemaVersion: SCHEMA_VERSION }))).toBe(
      false
    );
  });

  it("detects a save written by a newer version", () => {
    const raw = JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 });
    expect(getSavedSchemaVersion(raw)).toBe(SCHEMA_VERSION + 1);
    expect(isNewerSave(raw)).toBe(true);
  });
});

describe("study-day history", () => {
  it("derives a streak from the history instead of a stored counter", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: {},
        stats: {
          ...stats,
          streak: 99,
          highestStreak: 120,
          lastStudyDate: "2026-10-31",
        },
        settings,
        studyDays: {
          "2026-10-31": { cards: 2, reviews: 3 },
          "2026-10-30": { cards: 1, reviews: 1 },
          "2026-10-29": { cards: 5, reviews: 6 },
          "2026-10-27": { cards: 1, reviews: 1 },
        },
      }),
      today
    );
    expect(state.stats.streak).toBe(3);
    expect(state.stats.highestStreak).toBe(120);
  });

  it("drops a streak broken by missing days", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      "2026-11-02"
    );
    // The only studied day is three days ago.
    expect(state.stats.streak).toBe(0);
  });

  it("shows yesterday's streak before today's first grade", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      "2026-10-31"
    );
    expect(state.stats.streak).toBe(1);
  });
});

describe("progress export and import", () => {
  const save = {
    schemaVersion: SCHEMA_VERSION,
    cardStates: { surv_001: card },
    stats,
    settings,
    studyDays,
    grammar: emptyGrammarProgress(),
  };

  it("exports the saved shape with an exportedAt timestamp", () => {
    const payload = buildExportPayload(
      parseSavedState(JSON.stringify(save), today),
      new Date("2026-10-30T12:00:00Z")
    );
    expect(payload).toEqual({
      ...save,
      exportedAt: "2026-10-30T12:00:00.000Z",
    });
  });

  it("leaves the review log out of the export by default", () => {
    const state = parseSavedState(
      JSON.stringify({ ...save, reviewLog }),
      today
    );
    const payload = buildExportPayload(state, new Date("2026-10-30T12:00:00Z"));
    expect(payload).not.toHaveProperty("reviewLog");
  });

  it("includes the review log when asked", () => {
    const state = parseSavedState(
      JSON.stringify({ ...save, reviewLog }),
      today
    );
    const payload = buildExportPayload(
      state,
      new Date("2026-10-30T12:00:00Z"),
      { includeReviewLog: true }
    );
    expect(payload).toEqual({
      ...save,
      reviewLog,
      exportedAt: "2026-10-30T12:00:00.000Z",
    });
  });

  it("round-trips an export that includes the review log", () => {
    const state = parseSavedState(
      JSON.stringify({ ...save, reviewLog }),
      today
    );
    const payload = buildExportPayload(
      state,
      new Date("2026-10-30T12:00:00Z"),
      { includeReviewLog: true }
    );
    // Pin the day: the streak is derived from studyDays against `today`, so
    // using the wall clock made this test fail after midnight.
    const result = validateImportPayload(JSON.stringify(payload), today);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hasReviewLog).toBe(true);
      expect(result.state.reviewLog).toEqual(reviewLog);
      expect(result.state.studyDays).toEqual(studyDays);
      expect(result.state.stats.streak).toBe(1);
    }
  });

  it("accepts a valid current-version file", () => {
    const result = validateImportPayload(JSON.stringify(save), today);
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
    const result = validateImportPayload(
      JSON.stringify({ ...save, exportedAt: "2026-10-30T12:00:00.000Z" })
    );
    expect(result.ok && result.exportedAt).toBe("2026-10-30T12:00:00.000Z");
  });

  it("accepts a valid older-version file and treats it as current", () => {
    const result = validateImportPayload(
      JSON.stringify({ ...save, schemaVersion: 1 })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.schemaVersion).toBe(SCHEMA_VERSION);
      expect(result.state.cardStates.surv_001).toEqual(card);
    }
  });

  it("rejects a missing cardStates object", () => {
    const { cardStates: _omitted, ...rest } = save;
    const result = validateImportPayload(JSON.stringify(rest));
    expect(result).toEqual({
      ok: false,
      reason: "The file is missing cardStates (each must be an object).",
    });
  });

  it("rejects a missing stats object", () => {
    const { stats: _omitted, ...rest } = save;
    const result = validateImportPayload(JSON.stringify(rest));
    expect(result).toEqual({
      ok: false,
      reason: "The file is missing stats (each must be an object).",
    });
  });

  it("rejects a missing settings object", () => {
    const { settings: _omitted, ...rest } = save;
    const result = validateImportPayload(JSON.stringify(rest));
    expect(result).toEqual({
      ok: false,
      reason: "The file is missing settings (each must be an object).",
    });
  });

  it("rejects a non-object cardStates value instead of silently defaulting", () => {
    const result = validateImportPayload(
      JSON.stringify({ cardStates: 5, stats, settings })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("cardStates");
  });

  it("rejects malformed JSON", () => {
    expect(validateImportPayload("{ not json")).toEqual({
      ok: false,
      reason: "The file is not valid JSON.",
    });
  });

  it("rejects a top-level value that is not an object", () => {
    expect(validateImportPayload("[1, 2, 3]").ok).toBe(false);
  });

  it("refuses a file with a newer schemaVersion", () => {
    const result = validateImportPayload(
      JSON.stringify({ ...save, schemaVersion: SCHEMA_VERSION + 1 })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("newer version of Goyo");
  });

  it("rejects a schemaVersion that is not a version number", () => {
    const result = validateImportPayload(
      JSON.stringify({ ...save, schemaVersion: "two" })
    );
    expect(result.ok).toBe(false);
  });

  it("accepts an empty cardStates object", () => {
    const result = validateImportPayload(
      JSON.stringify({ ...save, cardStates: {} })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.cardStates).toEqual({});
  });

  it("ignores extra unknown top-level keys when the required keys are valid", () => {
    const result = validateImportPayload(
      JSON.stringify({ ...save, extra: { evil: true } })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).not.toHaveProperty("extra");
  });
});

describe("applyGrade", () => {
  it("logs one entry per grade with the mode and response time", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: card },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    const at = new Date("2026-10-31T09:30:00.000Z");
    const first = applyGrade(
      state,
      "surv_001",
      "good",
      { mode: "daily", responseTimeMs: 2500 },
      at
    );
    const second = applyGrade(first, "surv_001", "again", { mode: "weak" }, at);

    expect(second.reviewLog.entries).toHaveLength(2);
    expect(second.reviewLog.entries[0]).toMatchObject({
      cardId: "surv_001",
      rating: "good",
      responseTimeMs: 2500,
      mode: "daily",
      at: "2026-10-31T09:30:00.000Z",
    });
    expect(second.reviewLog.entries[1]).toMatchObject({
      rating: "again",
      responseTimeMs: null,
      mode: "weak",
    });
  });

  it("counts a distinct card once per day but every accepted review", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: card },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    const at = new Date("2026-10-31T09:30:00.000Z");
    const first = applyGrade(state, "surv_001", "good", {}, at);
    const second = applyGrade(first, "surv_002", "good", {}, at);

    expect(second.studyDays["2026-10-31"]).toEqual({ cards: 2, reviews: 2 });
    expect(second.stats.streak).toBe(2);
  });

  it("keeps a card first met in listening on a one- to two-day interval", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      today
    );
    const graded = applyGrade(
      state,
      "surv_001",
      "easy",
      { mode: "listening" },
      new Date("2026-10-31T09:30:00.000Z")
    );

    expect(graded.cardStates.surv_001.timesReviewed).toBe(1);
    expect(graded.cardStates.surv_001.interval).toBe(2);
    expect(graded.cardStates.surv_001.consecutiveCorrect).toBe(0);
  });

  it("logs shadowing without touching the schedule or progress", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: card },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    const at = new Date("2026-10-31T09:30:00.000Z");
    const practiced = applyGrade(
      state,
      "surv_001",
      "good",
      { mode: "shadowing", practiceOnly: true },
      at
    );

    expect(practiced.cardStates).toEqual(state.cardStates);
    expect(practiced.stats).toEqual(state.stats);
    expect(practiced.studyDays).toEqual(state.studyDays);
    expect(practiced.reviewLog.entries).toHaveLength(1);
    expect(practiced.reviewLog.entries[0]).toMatchObject({
      mode: "shadowing",
      rating: "good",
    });
  });

  it("counts the first successful recall of a new card", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      today
    );
    const graded = applyGrade(
      state,
      "surv_002",
      "good",
      {},
      new Date("2026-10-31T09:30:00.000Z")
    );

    expect(graded.stats.totalCardsLearned).toBe(stats.totalCardsLearned + 1);
  });

  it("counts a card first failed, then recalled on a later day, once", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      today
    );
    const first = applyGrade(
      state,
      "surv_002",
      "again",
      {},
      new Date("2026-10-31T09:30:00.000Z")
    );
    expect(first.stats.totalCardsLearned).toBe(stats.totalCardsLearned);

    const later = applyGrade(
      first,
      "surv_002",
      "good",
      {},
      new Date("2026-11-01T09:30:00.000Z")
    );
    expect(later.stats.totalCardsLearned).toBe(stats.totalCardsLearned + 1);
  });

  it("does not count a later successful recall again", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      today
    );
    const first = applyGrade(
      state,
      "surv_002",
      "good",
      {},
      new Date("2026-10-31T09:30:00.000Z")
    );
    const second = applyGrade(
      first,
      "surv_002",
      "good",
      {},
      new Date("2026-11-01T09:30:00.000Z")
    );

    expect(second.stats.totalCardsLearned).toBe(stats.totalCardsLearned + 1);
  });

  it("does not count shadowing an unseen card as learned", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      today
    );
    const practiced = applyGrade(
      state,
      "surv_002",
      "good",
      { mode: "shadowing", practiceOnly: true },
      new Date("2026-10-31T09:30:00.000Z")
    );

    expect(practiced.stats.totalCardsLearned).toBe(stats.totalCardsLearned);
  });

  it("does not count a same-day re-grade as another review", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: { surv_001: card },
        stats,
        settings,
        studyDays,
      }),
      today
    );
    const at = new Date("2026-10-31T09:30:00.000Z");
    const first = applyGrade(state, "surv_001", "again", {}, at);
    const retry = applyGrade(first, "surv_001", "good", {}, at);

    expect(retry.studyDays["2026-10-31"]).toEqual({ cards: 1, reviews: 1 });
    expect(retry.reviewLog.entries).toHaveLength(2);
    // A second try after "Again" must not earn XP or move the schedule again.
    expect(retry.stats.totalXp).toBe(first.stats.totalXp);
    expect(retry.cardStates.surv_001.timesReviewed).toBe(
      first.cardStates.surv_001.timesReviewed
    );
  });
});

describe("grammar progress in the save", () => {
  const grammar = {
    completedLessonIds: ["copula", "past"],
    scores: { copula: { correct: 2, total: 2 } },
    lastLessonId: "past",
  };

  it("loads saved grammar progress and sanitizes it", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: {},
        stats,
        settings,
        studyDays,
        grammar,
      }),
      today
    );
    expect(state.grammar).toEqual(grammar);
  });

  it("defaults grammar progress for older saves", () => {
    const state = parseSavedState(
      JSON.stringify({ cardStates: {}, stats, settings, studyDays }),
      today
    );
    expect(state.grammar).toEqual(emptyGrammarProgress());
  });

  it("carries grammar progress in the export", () => {
    const state = parseSavedState(
      JSON.stringify({
        cardStates: {},
        stats,
        settings,
        studyDays,
        grammar,
      }),
      today
    );
    expect(buildExportPayload(state)).toHaveProperty("grammar", grammar);
  });
});

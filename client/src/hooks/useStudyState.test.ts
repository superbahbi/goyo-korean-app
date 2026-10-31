import { describe, it, expect } from "vitest";
import { buildExportPayload, parseSavedState, SCHEMA_VERSION, validateImportPayload } from "./useStudyState";

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
  cardsStudiedToday: 1,
  totalCardsLearned: 1,
};
const settings = {
  dailyGoal: 10,
  ttsEnabled: true,
  autoPlayAudio: true,
  audioSpeaker: "elevenlabs",
};

describe("saved progress schemaVersion", () => {
  it("loads a save without schemaVersion as the current version", () => {
    const state = parseSavedState(JSON.stringify({ cardStates: { surv_001: card }, stats, settings }));
    expect(SCHEMA_VERSION).toBe(2);
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.cardStates.surv_001).toEqual(card);
    expect(state.stats).toEqual(stats);
    expect(state.settings).toEqual(settings);
  });

  it("treats an older schemaVersion as current without migrating the data", () => {
    const state = parseSavedState(JSON.stringify({ schemaVersion: 1, cardStates: { surv_001: card }, stats, settings }));
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.cardStates.surv_001).toEqual(card);
  });

  it("loads a save with the current schemaVersion unchanged", () => {
    const saved = { schemaVersion: SCHEMA_VERSION, cardStates: { surv_001: card }, stats, settings };
    expect(parseSavedState(JSON.stringify(saved))).toEqual(saved);
  });

  it("starts from the current version when nothing is saved", () => {
    expect(parseSavedState(null).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("ignores a legacy box field when loading saved cards", () => {
    const legacyCard = { ...card, box: 1 };
    const state = parseSavedState(
      JSON.stringify({ cardStates: { surv_001: legacyCard }, stats, settings }),
    );
    expect(state.cardStates.surv_001).toEqual(card);
    expect(state.cardStates.surv_001).not.toHaveProperty("box");
  });
});

describe("progress export and import", () => {
  const save = { schemaVersion: SCHEMA_VERSION, cardStates: { surv_001: card }, stats, settings };

  it("exports the saved shape with an exportedAt timestamp", () => {
    const payload = buildExportPayload(parseSavedState(JSON.stringify(save)), new Date("2026-10-30T12:00:00Z"));
    expect(payload).toEqual({ ...save, exportedAt: "2026-10-30T12:00:00.000Z" });
  });

  it("accepts a valid current-version file", () => {
    const result = validateImportPayload(JSON.stringify(save));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.cardStates.surv_001).toEqual(card);
      expect(result.state.stats).toEqual(stats);
      expect(result.state.settings).toEqual(settings);
      expect(result.exportedAt).toBeNull();
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

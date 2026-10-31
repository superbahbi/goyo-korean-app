import { describe, it, expect } from "vitest";
import { parseSavedState, SCHEMA_VERSION } from "./useStudyState";

const card = {
  id: "surv_001",
  box: 1,
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
});

import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../client/src/components/practice/scenarios";
import { getLocalDateKey } from "../../client/src/lib/day";
import { NO_DIALOG, reduceDialog } from "../../client/src/lib/dialogLauncher";
import { GRAMMAR_LESSONS } from "../../client/src/lib/grammar";
import { buildDashboardView } from "../../client/src/lib/dashboardView";
import { parseSavedState } from "../../client/src/lib/savedState";
import { createStudySession } from "../../client/src/lib/studySession";
import { CURATED_CARDS } from "../../client/src/lib/vocabulary";
import {
  createCrossPlatformProgressStore,
  createMemoryStorage,
} from "../../packages/shared/storage";
import {
  DARK_THEME,
  LIGHT_THEME,
  getThemeColors,
} from "../../packages/shared/theme";
import { Platform, StyleSheet, flattenStyle } from "./primitives/dom";

describe("Mobile DOM kit & shared codebase", () => {
  it("flattens nested React Native style arrays cleanly", () => {
    const styles = StyleSheet.create({
      box: { padding: 12, backgroundColor: "#ffffff" },
      active: { backgroundColor: "#059669", borderRadius: 16 },
    });

    const merged = StyleSheet.flatten([
      styles.box,
      false,
      undefined,
      [styles.active, { padding: 20 }],
    ]);

    expect(merged).toEqual({
      padding: 20,
      backgroundColor: "#059669",
      borderRadius: 16,
    });
    expect(flattenStyle(null)).toBeUndefined();
  });

  it("detects platform and selects platform-specific values", () => {
    expect(["web", "ios", "android"]).toContain(Platform.OS);
    const selected = Platform.select({
      ios: "ios-val",
      android: "android-val",
      web: "web-val",
    });
    expect(selected).toBe(`${Platform.OS}-val`);
  });

  it("grades through the shared store and derives the same dashboard the web app computes", () => {
    const store = createCrossPlatformProgressStore(createMemoryStorage());
    const today = getLocalDateKey();
    const firstCard = CURATED_CARDS[0]!;

    const outcome = store.gradeCard(firstCard.id, "good", { mode: "daily" });
    expect(outcome.xp).toBeGreaterThan(0);

    const state = store.getState();
    const view = buildDashboardView({
      vocabulary: CURATED_CARDS,
      studyReady: CURATED_CARDS,
      cardStates: state.cardStates,
      studyDays: state.studyDays,
      reviewEntries: state.reviewLog.entries.length,
      today,
      dailyGoal: state.settings.dailyGoal,
      newCardsPerDay: state.settings.newCardsPerDay,
      level: state.stats.level,
      totalXp: state.stats.totalXp,
      streak: state.stats.streak,
      scenarioCardIds: SCENARIOS.map(s => s.cardId),
      labelDate: key => key,
    });

    expect(view.today.cardsStudiedToday).toBe(1);
    expect(GRAMMAR_LESSONS.length).toBe(18);

    const session = createStudySession({
      queue: CURATED_CARDS.slice(0, 2),
      clock: () => 1000,
      isNewCard: id => !state.cardStates[id],
      onGrade: () => {},
      stopAudio: () => {},
      onClose: () => {},
    });
    expect(session.getState().queue.length).toBe(2);

    const dialog = reduceDialog(NO_DIALOG, {
      type: "open",
      request: { kind: "browse", category: "survival" },
    });
    expect(dialog).toEqual({ kind: "browse", category: "survival" });
    expect(getThemeColors("light")).toBe(LIGHT_THEME);
    expect(getThemeColors("dark")).toBe(DARK_THEME);
    expect(parseSavedState(null).settings.dailyGoal).toBe(10);
  });
});

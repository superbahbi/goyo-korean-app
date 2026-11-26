import { describe, expect, it } from "vitest";
import {
  DAILY_GOAL_OPTIONS,
  NEW_CARDS_PER_DAY_OPTIONS,
  paceOptions,
} from "./studyPace";
import { parseSavedState } from "./savedState";

describe("study pace options", () => {
  it("offers the default pace on both lists", () => {
    const defaults = parseSavedState(null).settings;
    expect(DAILY_GOAL_OPTIONS).toContain(defaults.dailyGoal);
    expect(NEW_CARDS_PER_DAY_OPTIONS).toContain(defaults.newCardsPerDay);
  });

  it("keeps the list as is when the saved value is on it", () => {
    expect(paceOptions(DAILY_GOAL_OPTIONS, 30)).toEqual([5, 10, 15, 20, 30]);
  });

  it("adds an off-list saved value in order, so it still shows as chosen", () => {
    expect(paceOptions(DAILY_GOAL_OPTIONS, 25)).toEqual([
      5, 10, 15, 20, 25, 30,
    ]);
    expect(paceOptions(NEW_CARDS_PER_DAY_OPTIONS, 4)).toEqual([
      1, 2, 3, 4, 5, 8, 10,
    ]);
  });

  it("ignores a value that is not a number", () => {
    expect(paceOptions(NEW_CARDS_PER_DAY_OPTIONS, Number.NaN)).toEqual([
      1, 2, 3, 5, 8, 10,
    ]);
  });
});

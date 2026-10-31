import { describe, expect, it } from "vitest";
import {
  LEVEL_TITLES,
  levelFromXp,
  levelProgress,
  levelTitle,
  xpToReachLevel,
} from "./xp";

describe("level math", () => {
  it("starts at level 1 and steps up at each squared threshold", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(399)).toBe(2);
    expect(levelFromXp(400)).toBe(3);
    expect(levelFromXp(900)).toBe(4);
  });

  it("keeps large totals exact", () => {
    expect(levelFromXp(1_000_000)).toBe(101);
    expect(levelFromXp(xpToReachLevel(250))).toBe(250);
    expect(levelFromXp(xpToReachLevel(250) - 1)).toBe(249);
  });

  it("reports progress within the current level", () => {
    expect(levelProgress(0, 1)).toBe(0);
    expect(levelProgress(50, 1)).toBe(50);
    expect(levelProgress(100, 2)).toBe(0);
    expect(levelProgress(250, 2)).toBe(50);
    expect(levelProgress(400, 3)).toBe(0);
  });

  it("clamps progress for edited or out-of-range totals", () => {
    expect(levelProgress(-50, 1)).toBe(0);
    expect(levelProgress(500, 1)).toBe(100);
  });

  it("maps levels to titles and clamps past the end", () => {
    expect(levelTitle(1)).toBe("Beginner");
    expect(levelTitle(4)).toBe("Conversational");
    expect(levelTitle(LEVEL_TITLES.length)).toBe("Korean Sage");
    expect(levelTitle(0)).toBe("Beginner");
    expect(levelTitle(99)).toBe("Korean Sage");
  });
});

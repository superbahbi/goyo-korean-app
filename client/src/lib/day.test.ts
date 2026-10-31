import { describe, it, expect } from "vitest";
import { addDays, getLocalDateKey, msUntilNextLocalMidnight } from "./day";

describe("day keys", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(getLocalDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("shifts a day key by whole days", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("msUntilNextLocalMidnight", () => {
  it("counts down to the next local midnight", () => {
    const now = new Date(2026, 9, 31, 23, 59, 30, 250);
    const nextMidnight = new Date(2026, 10, 1, 0, 0, 0, 0);
    expect(msUntilNextLocalMidnight(now)).toBe(nextMidnight.getTime() - now.getTime());
  });

  it("aims at tomorrow's midnight when the day has just started", () => {
    const now = new Date(2026, 9, 31, 0, 0, 0, 0);
    const delay = msUntilNextLocalMidnight(now);
    const next = new Date(now.getTime() + delay);

    expect(delay).toBeGreaterThan(0);
    expect([next.getDate(), next.getHours(), next.getMinutes(), next.getSeconds(), next.getMilliseconds()]).toEqual([
      1, 0, 0, 0, 0,
    ]);
  });
});

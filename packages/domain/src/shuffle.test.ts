import { afterEach, describe, expect, it, vi } from "vitest";
import { shuffle } from "./shuffle";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shuffle", () => {
  it("returns every item exactly once", () => {
    const items = ["a", "b", "c", "d", "e"];
    const shuffled = shuffle(items);

    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort()).toEqual([...items].sort());
  });

  it("does not mutate the input", () => {
    const items = [1, 2, 3, 4];
    const copy = [...items];

    shuffle(items);

    expect(items).toEqual(copy);
  });

  it("walks the array with Fisher–Yates swaps", () => {
    // Math.random() === 0 makes every swap target index 0:
    // [1,2,3,4] -> [4,2,3,1] -> [3,2,4,1] -> [2,3,4,1]
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
  });

  it("handles empty and single-item arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["only"])).toEqual(["only"]);
  });
});

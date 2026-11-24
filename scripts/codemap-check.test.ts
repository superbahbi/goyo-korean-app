import { describe, expect, it } from "vitest";
import { deadEntries } from "./codemap-check";

const exists =
  (...paths: string[]) =>
  (key: string) =>
    paths.includes(key);

describe("codemap cache guard", () => {
  it("returns nothing when every key is on disk", () => {
    const cache = {
      file_hashes: { "src/a.ts": "x" },
      folder_hashes: { src: "y" },
    };

    expect(deadEntries(cache, exists("src/a.ts", "src"))).toEqual([]);
  });

  it("reports file and folder keys whose path is gone", () => {
    const cache = {
      file_hashes: { "src/a.ts": "x", "client/src/old.ts": "x" },
      folder_hashes: { src: "y", "client/src": "y" },
    };

    expect(deadEntries(cache, exists("src/a.ts", "src"))).toEqual([
      "client/src",
      "client/src/old.ts",
    ]);
  });

  it("reports a path listed in both maps once", () => {
    const cache = {
      file_hashes: { "client/src": "x" },
      folder_hashes: { "client/src": "y" },
    };

    expect(deadEntries(cache, exists())).toEqual(["client/src"]);
  });

  it("treats an empty cache as current", () => {
    expect(deadEntries({}, exists())).toEqual([]);
  });
});

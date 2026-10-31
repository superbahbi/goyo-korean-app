import { describe, expect, it } from "vitest";
import { PRECACHE_GLOBS } from "./pwaConfig";

// Offline audio shipped broken once because the index that every clip is
// resolved through was never precached. The vocabulary clips can stay on demand;
// the index cannot.
describe("service worker precache", () => {
  it("precaches the audio index so clips resolve offline", () => {
    expect(PRECACHE_GLOBS).toContain("audio/index.json");
  });

  it("keeps the app shell in the precache", () => {
    expect(PRECACHE_GLOBS.some(glob => glob.includes("js"))).toBe(true);
  });
});

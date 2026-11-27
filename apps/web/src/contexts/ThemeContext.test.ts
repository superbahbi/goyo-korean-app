import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "@shared/theme";
import { THEME_STORAGE_KEY as CONTEXT_KEY } from "./ThemeContext";

/**
 * apps/web/index.html applies the saved theme before React mounts, through
 * public/theme-init.js. If that script and the React provider read different
 * keys, a dark-mode learner gets a light flash on every load and the toggle
 * stops sticking, so the three places that name the key must agree.
 */
const root = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

describe("theme storage key across the web client", () => {
  it("is the key ThemeContext exports", () => {
    expect(CONTEXT_KEY).toBe(THEME_STORAGE_KEY);
  });

  it("is imported by ThemeContext.tsx, not redefined there as a literal", () => {
    const source = read("apps/web/src/contexts/ThemeContext.tsx");

    expect(source).toContain(`from "@shared/theme"`);
    expect(source).not.toContain(`"${THEME_STORAGE_KEY}"`);
  });

  it("is the only key the pre-paint script public/theme-init.js reads", () => {
    const script = read("public/theme-init.js");
    const reads = [
      ...script.matchAll(/localStorage\.getItem\(\s*["']([^"']+)["']/g),
    ];

    expect(reads.map(match => match[1])).toEqual([THEME_STORAGE_KEY]);
  });
});

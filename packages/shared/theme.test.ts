import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY as CONTEXT_KEY } from "@/contexts/ThemeContext";
import {
  DARK_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  getThemeColors,
} from "./theme";

const root = path.resolve(import.meta.dirname, "..", "..");
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

describe("theme palettes", () => {
  it("defines every LIGHT key in DARK and every DARK key in LIGHT", () => {
    const light = Object.keys(LIGHT_THEME).sort();
    const dark = Object.keys(DARK_THEME).sort();

    expect(dark.filter(key => !light.includes(key))).toEqual([]);
    expect(light.filter(key => !dark.includes(key))).toEqual([]);
  });

  it("gives every colour in both palettes as a 6-digit hex string", () => {
    for (const palette of [LIGHT_THEME, DARK_THEME]) {
      for (const [key, value] of Object.entries(palette)) {
        expect(value, key).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("picks the palette for a resolved mode", () => {
    expect(getThemeColors("light")).toBe(LIGHT_THEME);
    expect(getThemeColors("dark")).toBe(DARK_THEME);
  });
});

describe("theme storage key", () => {
  it("is goyo-theme in packages/shared/theme.ts", () => {
    expect(THEME_STORAGE_KEY).toBe("goyo-theme");
  });

  it("is the same key ThemeContext exports", () => {
    expect(CONTEXT_KEY).toBe(THEME_STORAGE_KEY);
  });

  it("is not redefined as a literal inside ThemeContext.tsx", () => {
    const source = read("apps/web/src/contexts/ThemeContext.tsx");

    expect(source).toContain(`from "@shared/theme"`);
    expect(source).not.toContain(THEME_STORAGE_KEY);
  });

  it("is the key the pre-paint script public/theme-init.js reads", () => {
    const script = read("public/theme-init.js");
    const reads = [
      ...script.matchAll(/localStorage\.getItem\(\s*["']([^"']+)["']/g),
    ];

    expect(reads.map(match => match[1])).toEqual([THEME_STORAGE_KEY]);
  });
});

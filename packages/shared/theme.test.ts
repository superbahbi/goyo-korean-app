import { describe, expect, it } from "vitest";
import {
  DARK_THEME,
  LIGHT_THEME,
  THEME_STORAGE_KEY,
  getThemeColors,
} from "./theme";

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
  // The web client and the pre-paint script must read the same key; that
  // cross-surface check lives in apps/web/src/contexts/ThemeContext.test.ts.
  it("is goyo-theme", () => {
    expect(THEME_STORAGE_KEY).toBe("goyo-theme");
  });
});

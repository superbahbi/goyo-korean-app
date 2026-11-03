import { describe, it, expect } from "vitest";
import { ALPHABET_DATA } from "./alphabet";
import {
  HANGUL_STROKE_ORDER,
  getHangulStrokes,
  hasHangulStrokes,
} from "./hangulStrokes";

/**
 * Standard school-chart stroke counts. ㄱ and ㄴ are one continuous movement,
 * while a box such as ㅁ takes four separate strokes.
 */
const EXPECTED_STROKE_COUNTS: Record<string, number> = {
  ㄱ: 1,
  ㄲ: 2,
  ㄴ: 1,
  ㄷ: 2,
  ㄸ: 4,
  ㄹ: 3,
  ㅁ: 4,
  ㅂ: 4,
  ㅃ: 8,
  ㅅ: 2,
  ㅆ: 4,
  ㅇ: 1,
  ㅈ: 3,
  ㅉ: 6,
  ㅊ: 4,
  ㅋ: 2,
  ㅌ: 3,
  ㅍ: 4,
  ㅎ: 3,
  ㅏ: 2,
  ㅐ: 3,
  ㅑ: 3,
  ㅒ: 4,
  ㅓ: 2,
  ㅔ: 3,
  ㅕ: 3,
  ㅖ: 4,
  ㅗ: 2,
  ㅘ: 4,
  ㅙ: 5,
  ㅚ: 3,
  ㅛ: 3,
  ㅜ: 2,
  ㅝ: 4,
  ㅞ: 5,
  ㅟ: 3,
  ㅠ: 3,
  ㅡ: 1,
  ㅢ: 2,
  ㅣ: 1,
};

describe("Hangul stroke order", () => {
  it("has a diagram for every alphabet card and no others", () => {
    expect(Object.keys(HANGUL_STROKE_ORDER).sort()).toEqual(
      ALPHABET_DATA.map(card => card.id).sort()
    );
  });

  it("draws the same jamo as its alphabet card", () => {
    for (const card of ALPHABET_DATA) {
      expect(HANGUL_STROKE_ORDER[card.id]?.hangul).toBe(card.hangul);
    }
  });

  it("uses the standard stroke count for every character", () => {
    for (const card of ALPHABET_DATA) {
      expect({
        hangul: card.hangul,
        strokes: getHangulStrokes(card.id).length,
      }).toEqual({
        hangul: card.hangul,
        strokes: EXPECTED_STROKE_COUNTS[card.hangul],
      });
    }
  });

  it("keeps every path inside the 100 × 100 grid and drawable", () => {
    for (const [characterId, diagram] of Object.entries(HANGUL_STROKE_ORDER)) {
      for (const path of diagram.strokes) {
        expect(path, characterId).toMatch(/^M[\d\s.,-]/);
        expect(path, characterId).toMatch(/^[MHVQALZ\d\s.,-]+$/);

        const numbers = path.match(/-?\d+(?:\.\d+)?/g) ?? [];
        expect(numbers.length, characterId).toBeGreaterThan(1);
        for (const value of numbers.map(Number)) {
          expect(Number.isFinite(value), `${characterId}: ${path}`).toBe(true);
          expect(value, `${characterId}: ${path}`).toBeGreaterThanOrEqual(0);
          expect(value, `${characterId}: ${path}`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("reports unknown characters as having no diagram", () => {
    expect(getHangulStrokes("cons_999")).toEqual([]);
    expect(hasHangulStrokes("cons_999")).toBe(false);
    expect(hasHangulStrokes("cons_001")).toBe(true);
  });
});

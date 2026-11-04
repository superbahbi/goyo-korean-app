/**
 * Stroke order for every jamo shown in the alphabet screen.
 *
 * Each entry is a list of SVG path strings on a 100 × 100 grid, one path per
 * pen stroke, listed in the order a learner writes them. The paths are
 * centre lines (not outlines), so a view can draw them with a round stroke and
 * animate them one after another. Strokes bow and turn on curves rather than
 * sitting on a straight grid, so the diagrams read like writing rather than
 * like a box drawing. Stroke order follows the standard school chart: left to
 * right, top to bottom, and one continuous movement counts as one stroke (for
 * example ㄱ is one stroke, ㅁ is four).
 */
export interface HangulStrokeDiagram {
  /** The jamo this diagram draws; matches the alphabet card's `hangul`. */
  hangul: string;
  /** One SVG path per stroke, in writing order, on a 100 × 100 grid. */
  strokes: readonly string[];
}

export const HANGUL_STROKE_ORDER: Record<string, HangulStrokeDiagram> = {
  // Basic consonants
  cons_001: {
    hangul: "ㄱ",
    strokes: [
      "M22 26 Q47 23 68 27 C72 31 74 38 74 46 C74 56 73 64 70 70 C68 75 64 78 59 79",
    ],
  },
  cons_002: {
    hangul: "ㄴ",
    strokes: [
      "M26 22 C25 38 25 55 27 65 C29 74 35 78 45 78 C56 79 68 78 78 78",
    ],
  },
  cons_003: {
    hangul: "ㄷ",
    strokes: [
      "M22 24 Q48 21 74 24",
      "M22 24 C21 40 21 57 23 65 C25 74 32 78 42 78 C56 79 66 78 74 78",
    ],
  },
  cons_004: {
    hangul: "ㄹ",
    strokes: [
      "M22 22 Q49 19 76 22",
      "M76 22 C77 32 77 39 75 44 C73 49 67 50 59 50 C46 51 33 50 22 50",
      "M22 50 C21 61 21 68 24 73 C27 78 33 80 42 79 C56 80 68 79 78 78",
    ],
  },
  cons_005: {
    hangul: "ㅁ",
    strokes: [
      "M24 26 Q22 50 24 74",
      "M26 24 Q50 22 74 24",
      "M76 26 Q78 50 76 74",
      "M26 76 Q50 78 74 76",
    ],
  },
  cons_006: {
    hangul: "ㅂ",
    strokes: [
      "M24 24 Q22 51 24 78",
      "M76 24 Q78 51 76 78",
      "M26 50 Q50 48 74 50",
      "M26 78 Q50 76 74 78",
    ],
  },
  cons_007: {
    hangul: "ㅅ",
    strokes: ["M50 22 Q34 46 25 78", "M50 22 Q66 46 75 78"],
  },
  cons_008: {
    hangul: "ㅇ",
    strokes: [
      "M50 20 C66 20 80 33 80 50 C80 67 66 80 50 80 C34 80 20 67 20 50 C20 33 34 20 50 20",
    ],
  },
  cons_009: {
    hangul: "ㅈ",
    strokes: [
      "M24 28 Q50 25 76 28",
      "M50 28 Q38 52 27 80",
      "M50 28 Q62 52 73 80",
    ],
  },
  cons_010: {
    hangul: "ㅊ",
    strokes: [
      "M50 12 Q49 17 50 22",
      "M24 30 Q50 27 76 30",
      "M50 30 Q38 54 27 82",
      "M50 30 Q62 54 73 82",
    ],
  },
  cons_011: {
    hangul: "ㅋ",
    strokes: [
      "M22 26 Q46 23 68 27 C72 31 74 38 74 46 C74 56 73 63 70 68 C68 73 64 76 59 77",
      "M22 48 Q45 46 70 48",
    ],
  },
  cons_012: {
    hangul: "ㅌ",
    strokes: [
      "M22 24 Q48 21 74 24",
      "M32 50 Q53 48 74 50",
      "M22 24 C21 40 21 57 23 65 C25 74 32 78 42 78 C56 79 66 78 74 78",
    ],
  },
  cons_013: {
    hangul: "ㅍ",
    strokes: [
      "M30 26 Q50 24 70 26",
      "M38 26 Q37 48 38 70",
      "M62 26 Q63 48 62 70",
      "M20 70 Q50 68 80 70",
    ],
  },
  cons_014: {
    hangul: "ㅎ",
    strokes: [
      "M50 12 Q49 16 50 20",
      "M40 21 Q50 20 60 21",
      "M50 30 C64 30 74 41 74 54 C74 67 63 78 50 78 C37 78 26 67 26 54 C26 41 36 30 50 30",
    ],
  },

  // Double consonants
  cons_015: {
    hangul: "ㄲ",
    strokes: [
      "M8 26 Q26 23 38 26 C41 30 42 36 42 43 C42 52 41 59 39 64 C37 69 34 71 31 72",
      "M54 26 Q72 23 84 26 C87 30 88 36 88 43 C88 52 87 59 85 64 C83 69 80 71 77 72",
    ],
  },
  cons_016: {
    hangul: "ㄸ",
    strokes: [
      "M8 24 Q26 21 44 24",
      "M8 24 C7 40 7 57 9 65 C11 74 18 78 28 78 C36 79 41 78 44 78",
      "M54 24 Q72 21 90 24",
      "M54 24 C53 40 53 57 55 65 C57 74 64 78 74 78 C82 79 87 78 90 78",
    ],
  },
  cons_017: {
    hangul: "ㅃ",
    strokes: [
      "M10 24 Q8 51 10 78",
      "M42 24 Q44 51 42 78",
      "M12 50 Q26 48 40 50",
      "M12 78 Q26 76 40 78",
      "M58 24 Q56 51 58 78",
      "M90 24 Q92 51 90 78",
      "M60 50 Q74 48 88 50",
      "M60 78 Q74 76 88 78",
    ],
  },
  cons_018: {
    hangul: "ㅆ",
    strokes: [
      "M26 22 Q14 46 8 78",
      "M26 22 Q38 46 44 78",
      "M74 22 Q62 46 56 78",
      "M74 22 Q86 46 92 78",
    ],
  },
  cons_019: {
    hangul: "ㅉ",
    strokes: [
      "M8 28 Q26 25 44 28",
      "M26 28 Q17 52 8 80",
      "M26 28 Q35 52 44 80",
      "M56 28 Q74 25 92 28",
      "M74 28 Q65 52 56 80",
      "M74 28 Q83 52 92 80",
    ],
  },

  // Basic vowels
  vowel_001: {
    hangul: "ㅏ",
    strokes: ["M40 16 Q38 50 40 84", "M38 50 Q50 49 62 50"],
  },
  vowel_002: {
    hangul: "ㅑ",
    strokes: [
      "M40 16 Q38 50 40 84",
      "M38 40 Q50 39 62 40",
      "M38 60 Q50 59 62 60",
    ],
  },
  vowel_003: {
    hangul: "ㅓ",
    strokes: ["M60 16 Q62 50 60 84", "M62 50 Q50 49 38 50"],
  },
  vowel_004: {
    hangul: "ㅕ",
    strokes: [
      "M60 16 Q62 50 60 84",
      "M62 40 Q50 39 38 40",
      "M62 60 Q50 59 38 60",
    ],
  },
  vowel_005: {
    hangul: "ㅗ",
    strokes: ["M50 30 Q49 44 50 58", "M22 58 Q50 56 78 58"],
  },
  vowel_006: {
    hangul: "ㅛ",
    strokes: [
      "M38 30 Q37 44 38 58",
      "M62 30 Q63 44 62 58",
      "M20 58 Q50 56 80 58",
    ],
  },
  vowel_007: {
    hangul: "ㅜ",
    strokes: ["M22 40 Q50 38 78 40", "M50 40 Q49 56 50 72"],
  },
  vowel_008: {
    hangul: "ㅠ",
    strokes: [
      "M20 40 Q50 38 80 40",
      "M38 40 Q37 57 38 74",
      "M62 40 Q63 57 62 74",
    ],
  },
  vowel_009: { hangul: "ㅡ", strokes: ["M20 50 Q50 48 80 50"] },
  vowel_010: { hangul: "ㅣ", strokes: ["M50 14 Q48 50 50 86"] },

  // Compound vowels
  vowel_011: {
    hangul: "ㅐ",
    strokes: [
      "M34 16 Q32 50 34 84",
      "M32 50 Q50 49 68 50",
      "M68 16 Q70 50 68 84",
    ],
  },
  vowel_012: {
    hangul: "ㅒ",
    strokes: [
      "M34 16 Q32 50 34 84",
      "M32 40 Q50 39 68 40",
      "M32 60 Q50 59 68 60",
      "M68 16 Q70 50 68 84",
    ],
  },
  vowel_013: {
    hangul: "ㅔ",
    strokes: [
      "M44 16 Q42 50 44 84",
      "M42 50 Q33 49 24 50",
      "M64 16 Q66 50 64 84",
    ],
  },
  vowel_014: {
    hangul: "ㅖ",
    strokes: [
      "M44 16 Q42 50 44 84",
      "M42 40 Q33 39 24 40",
      "M42 60 Q33 59 24 60",
      "M64 16 Q66 50 64 84",
    ],
  },
  vowel_015: {
    hangul: "ㅘ",
    strokes: [
      "M34 28 Q33 44 34 58",
      "M14 58 Q38 60 63 58",
      "M62 16 Q64 50 62 84",
      "M64 44 Q72 43 80 44",
    ],
  },
  vowel_016: {
    hangul: "ㅙ",
    strokes: [
      "M24 30 Q23 45 24 60",
      "M8 60 Q32 62 56 60",
      "M56 16 Q54 50 56 84",
      "M54 44 Q67 43 80 44",
      "M80 16 Q82 50 80 84",
    ],
  },
  vowel_017: {
    hangul: "ㅚ",
    strokes: [
      "M38 30 Q37 45 38 60",
      "M16 60 Q40 62 64 60",
      "M62 16 Q64 50 62 84",
    ],
  },
  vowel_018: {
    hangul: "ㅝ",
    strokes: [
      "M14 56 Q38 58 62 56",
      "M36 56 Q35 67 36 78",
      "M60 16 Q62 50 60 84",
      "M62 40 Q53 39 44 40",
    ],
  },
  vowel_019: {
    hangul: "ㅞ",
    strokes: [
      "M8 56 Q32 58 55 56",
      "M28 56 Q27 67 28 78",
      "M56 16 Q54 50 56 84",
      "M55 38 Q48 37 42 38",
      "M78 16 Q80 50 78 84",
    ],
  },
  vowel_020: {
    hangul: "ㅟ",
    strokes: [
      "M14 52 Q38 54 62 52",
      "M34 52 Q33 65 34 78",
      "M60 16 Q62 50 60 84",
    ],
  },
  vowel_021: {
    hangul: "ㅢ",
    strokes: ["M14 50 Q39 48 64 50", "M62 16 Q64 50 62 84"],
  },
};

/** The stroke paths for one character, in writing order; empty when unknown. */
export function getHangulStrokes(characterId: string): readonly string[] {
  return HANGUL_STROKE_ORDER[characterId]?.strokes ?? [];
}

/** True when the character has stroke data, so a view can skip the diagram. */
export function hasHangulStrokes(characterId: string): boolean {
  return getHangulStrokes(characterId).length > 0;
}

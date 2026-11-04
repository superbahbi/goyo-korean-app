/**
 * Stroke order for every jamo shown in the alphabet screen.
 *
 * Each entry is a list of SVG path strings on a 100 × 100 grid, one path per
 * pen stroke, listed in the order a learner writes them. The paths are
 * centre lines (not outlines), so a view can draw them with a round stroke and
 * animate them one after another.
 *
 * The shapes follow the plain school-chart style: straight bars and stems,
 * with the curves a Korean letter actually has (the ㅅ diagonals and the ㅇ
 * circle) and no extra wobble. Stroke order follows the standard chart:
 * top to bottom, left to right, one continuous movement counts as one stroke,
 * and a tick left of a vowel stem is written before the stem. Circles start at
 * the top and run counter-clockwise.
 */
export interface HangulStrokeDiagram {
  /** The jamo this diagram draws; matches the alphabet card's `hangul`. */
  hangul: string;
  /** One SVG path per stroke, in writing order, on a 100 × 100 grid. */
  strokes: readonly string[];
}

export const HANGUL_STROKE_ORDER: Record<string, HangulStrokeDiagram> = {
  // Basic consonants
  cons_001: { hangul: "ㄱ", strokes: ["M20 26 H76 V84"] },
  cons_002: { hangul: "ㄴ", strokes: ["M24 16 V74 H80"] },
  cons_003: {
    hangul: "ㄷ",
    strokes: ["M26 26 H78", "M26 30 V82 H78"],
  },
  cons_004: {
    hangul: "ㄹ",
    strokes: ["M22 18 H76 V44", "M22 44 H76", "M22 50 V82 H80"],
  },
  cons_005: {
    hangul: "ㅁ",
    strokes: ["M26 20 V80", "M30 20 H76 V80", "M30 80 H74"],
  },
  cons_006: {
    hangul: "ㅂ",
    strokes: ["M26 16 V84", "M76 16 V84", "M30 52 H72", "M30 84 H72"],
  },
  cons_007: {
    hangul: "ㅅ",
    strokes: ["M50 20 L22 84", "M50 20 L80 84"],
  },
  cons_008: {
    hangul: "ㅇ",
    strokes: ["M50 23 A31 31 0 1 0 50 85 A31 31 0 1 0 50 23"],
  },
  cons_009: {
    hangul: "ㅈ",
    strokes: ["M20 26 H76 L26 86", "M54 52 L80 86"],
  },
  cons_010: {
    hangul: "ㅊ",
    strokes: ["M50 10 V21", "M22 34 H76 L30 88", "M56 58 L82 88"],
  },
  cons_011: {
    hangul: "ㅋ",
    strokes: ["M20 22 H76 V84", "M20 53 H72"],
  },
  cons_012: {
    hangul: "ㅌ",
    strokes: ["M26 18 H78", "M26 50 H78", "M24 24 V82 H80"],
  },
  cons_013: {
    hangul: "ㅍ",
    strokes: ["M20 22 H80", "M35 28 L31 76", "M65 28 L69 76", "M18 82 H82"],
  },
  cons_014: {
    hangul: "ㅎ",
    strokes: [
      "M50 8 V18",
      "M24 28 H76",
      "M50 41 A21 21 0 1 0 50 83 A21 21 0 1 0 50 41",
    ],
  },

  // Double consonants: the left letter completely, then the right one.
  cons_015: {
    hangul: "ㄲ",
    strokes: ["M8 26 H42 V84", "M54 26 H88 V84"],
  },
  cons_016: {
    hangul: "ㄸ",
    strokes: ["M8 26 H44", "M8 30 V82 H44", "M54 26 H90", "M54 30 V82 H90"],
  },
  cons_017: {
    hangul: "ㅃ",
    strokes: [
      "M10 16 V84",
      "M42 16 V84",
      "M13 52 H39",
      "M13 84 H39",
      "M58 16 V84",
      "M90 16 V84",
      "M61 52 H87",
      "M61 84 H87",
    ],
  },
  cons_018: {
    hangul: "ㅆ",
    strokes: [
      "M26 20 L10 84",
      "M26 20 L42 84",
      "M74 20 L58 84",
      "M74 20 L90 84",
    ],
  },
  cons_019: {
    hangul: "ㅉ",
    strokes: [
      "M8 26 H44 L12 86",
      "M30 52 L46 86",
      "M56 26 H90 L60 86",
      "M77 52 L92 86",
    ],
  },

  // Basic vowels. A tick to the left of the stem is written first.
  vowel_001: {
    hangul: "ㅏ",
    strokes: ["M40 14 V86", "M44 50 H68"],
  },
  vowel_002: {
    hangul: "ㅑ",
    strokes: ["M38 14 V86", "M42 38 H66", "M42 62 H66"],
  },
  vowel_003: {
    hangul: "ㅓ",
    strokes: ["M30 50 H54", "M60 14 V86"],
  },
  vowel_004: {
    hangul: "ㅕ",
    strokes: ["M30 36 H54", "M30 62 H54", "M60 14 V86"],
  },
  vowel_005: {
    hangul: "ㅗ",
    strokes: ["M50 24 V58", "M18 62 H82"],
  },
  vowel_006: {
    hangul: "ㅛ",
    strokes: ["M38 24 V58", "M62 24 V58", "M18 62 H82"],
  },
  vowel_007: {
    hangul: "ㅜ",
    strokes: ["M18 38 H82", "M50 42 V82"],
  },
  vowel_008: {
    hangul: "ㅠ",
    strokes: ["M18 36 H82", "M38 40 V80", "M62 40 V80"],
  },
  vowel_009: { hangul: "ㅡ", strokes: ["M16 50 H84"] },
  vowel_010: { hangul: "ㅣ", strokes: ["M50 12 V88"] },

  // Compound vowels: the left component in full, then the right one.
  vowel_011: {
    hangul: "ㅐ",
    strokes: ["M34 14 V86", "M38 50 H62", "M68 14 V86"],
  },
  vowel_012: {
    hangul: "ㅒ",
    strokes: ["M34 14 V86", "M38 38 H62", "M38 62 H62", "M68 14 V86"],
  },
  vowel_013: {
    hangul: "ㅔ",
    strokes: ["M22 50 H40", "M44 14 V86", "M64 14 V86"],
  },
  vowel_014: {
    hangul: "ㅖ",
    strokes: ["M22 38 H40", "M22 62 H40", "M44 14 V86", "M64 14 V86"],
  },
  vowel_015: {
    hangul: "ㅘ",
    strokes: ["M34 26 V56", "M12 60 H62", "M62 14 V86", "M66 48 H86"],
  },
  vowel_016: {
    hangul: "ㅙ",
    strokes: [
      "M26 26 V56",
      "M8 60 H52",
      "M52 14 V86",
      "M56 48 H68",
      "M72 14 V86",
    ],
  },
  vowel_017: {
    hangul: "ㅚ",
    strokes: ["M38 26 V56", "M16 60 H62", "M62 14 V86"],
  },
  vowel_018: {
    hangul: "ㅝ",
    strokes: ["M14 40 H60", "M34 44 V80", "M40 56 H56", "M60 14 V86"],
  },
  vowel_019: {
    hangul: "ㅞ",
    strokes: [
      "M8 40 H52",
      "M28 44 V80",
      "M38 56 H48",
      "M52 14 V86",
      "M72 14 V86",
    ],
  },
  vowel_020: {
    hangul: "ㅟ",
    strokes: ["M14 42 H60", "M34 46 V80", "M60 14 V86"],
  },
  vowel_021: {
    hangul: "ㅢ",
    strokes: ["M14 50 H62", "M62 12 V88"],
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

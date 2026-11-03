/**
 * Stroke order for every jamo shown in the alphabet screen.
 *
 * Each entry is a list of SVG path strings on a 100 × 100 grid, one path per
 * pen stroke, listed in the order a learner writes them. The paths are
 * centre lines (not outlines), so a view can draw them with a round stroke and
 * animate them one after another. Stroke order follows the standard school
 * chart: left to right, top to bottom, and one continuous movement counts as
 * one stroke (for example ㄱ is one stroke, ㅁ is four).
 */
export interface HangulStrokeDiagram {
  /** The jamo this diagram draws; matches the alphabet card's `hangul`. */
  hangul: string;
  /** One SVG path per stroke, in writing order, on a 100 × 100 grid. */
  strokes: readonly string[];
}

export const HANGUL_STROKE_ORDER: Record<string, HangulStrokeDiagram> = {
  // Basic consonants
  cons_001: { hangul: "ㄱ", strokes: ["M22 24 H74 V62 Q74 74 64 76"] },
  cons_002: { hangul: "ㄴ", strokes: ["M26 20 V66 Q26 76 36 76 H78"] },
  cons_003: {
    hangul: "ㄷ",
    strokes: ["M22 24 H74", "M22 24 V66 Q22 76 32 76 H74"],
  },
  cons_004: {
    hangul: "ㄹ",
    strokes: [
      "M22 22 H76",
      "M76 22 V44 Q76 50 70 50 H22",
      "M22 50 V72 Q22 78 28 78 H78",
    ],
  },
  cons_005: {
    hangul: "ㅁ",
    strokes: ["M24 24 V76", "M24 24 H76", "M76 24 V76", "M24 76 H76"],
  },
  cons_006: {
    hangul: "ㅂ",
    strokes: ["M24 22 V78", "M76 22 V78", "M24 50 H76", "M24 78 H76"],
  },
  cons_007: { hangul: "ㅅ", strokes: ["M50 22 L26 78", "M50 22 L74 78"] },
  cons_008: {
    hangul: "ㅇ",
    strokes: ["M50 20 A30 30 0 1 1 50 80 A30 30 0 1 1 50 20"],
  },
  cons_009: {
    hangul: "ㅈ",
    strokes: ["M24 28 H76", "M50 28 L26 80", "M50 28 L74 80"],
  },
  cons_010: {
    hangul: "ㅊ",
    strokes: ["M50 12 V22", "M24 30 H76", "M50 30 L26 82", "M50 30 L74 82"],
  },
  cons_011: {
    hangul: "ㅋ",
    strokes: ["M22 26 H72 V60 Q72 72 62 74", "M22 48 H72"],
  },
  cons_012: {
    hangul: "ㅌ",
    strokes: ["M22 24 H74", "M32 50 H74", "M22 24 V66 Q22 76 32 76 H74"],
  },
  cons_013: {
    hangul: "ㅍ",
    strokes: ["M30 26 H70", "M38 26 V70", "M62 26 V70", "M20 70 H80"],
  },
  cons_014: {
    hangul: "ㅎ",
    strokes: [
      "M50 12 V20",
      "M41 21 H59",
      "M50 30 A24 24 0 1 1 50 78 A24 24 0 1 1 50 30",
    ],
  },

  // Double consonants
  cons_015: {
    hangul: "ㄲ",
    strokes: ["M8 24 H42 V58 Q42 68 34 70", "M54 24 H88 V58 Q88 68 80 70"],
  },
  cons_016: {
    hangul: "ㄸ",
    strokes: [
      "M8 24 H42",
      "M8 24 V66 Q8 76 18 76 H44",
      "M54 24 H88",
      "M54 24 V66 Q54 76 64 76 H90",
    ],
  },
  cons_017: {
    hangul: "ㅃ",
    strokes: [
      "M10 22 V78",
      "M42 22 V78",
      "M10 50 H42",
      "M10 78 H42",
      "M58 22 V78",
      "M90 22 V78",
      "M58 50 H90",
      "M58 78 H90",
    ],
  },
  cons_018: {
    hangul: "ㅆ",
    strokes: [
      "M26 22 L8 78",
      "M26 22 L44 78",
      "M74 22 L56 78",
      "M74 22 L92 78",
    ],
  },
  cons_019: {
    hangul: "ㅉ",
    strokes: [
      "M8 26 H44",
      "M26 26 L8 80",
      "M26 26 L44 80",
      "M56 26 H92",
      "M74 26 L56 80",
      "M74 26 L92 80",
    ],
  },

  // Basic vowels
  vowel_001: { hangul: "ㅏ", strokes: ["M40 16 V84", "M40 50 H62"] },
  vowel_002: {
    hangul: "ㅑ",
    strokes: ["M40 16 V84", "M40 40 H62", "M40 60 H62"],
  },
  vowel_003: { hangul: "ㅓ", strokes: ["M60 16 V84", "M60 50 H38"] },
  vowel_004: {
    hangul: "ㅕ",
    strokes: ["M60 16 V84", "M60 40 H38", "M60 60 H38"],
  },
  vowel_005: { hangul: "ㅗ", strokes: ["M50 30 V58", "M22 58 H78"] },
  vowel_006: {
    hangul: "ㅛ",
    strokes: ["M38 30 V58", "M62 30 V58", "M20 58 H80"],
  },
  vowel_007: { hangul: "ㅜ", strokes: ["M22 40 H78", "M50 40 V72"] },
  vowel_008: {
    hangul: "ㅠ",
    strokes: ["M20 40 H80", "M38 40 V74", "M62 40 V74"],
  },
  vowel_009: { hangul: "ㅡ", strokes: ["M20 50 H80"] },
  vowel_010: { hangul: "ㅣ", strokes: ["M50 14 V86"] },

  // Compound vowels
  vowel_011: {
    hangul: "ㅐ",
    strokes: ["M34 16 V84", "M34 50 H66", "M68 16 V84"],
  },
  vowel_012: {
    hangul: "ㅒ",
    strokes: ["M34 16 V84", "M34 40 H66", "M34 60 H66", "M68 16 V84"],
  },
  vowel_013: {
    hangul: "ㅔ",
    strokes: ["M44 16 V84", "M44 50 H24", "M64 16 V84"],
  },
  vowel_014: {
    hangul: "ㅖ",
    strokes: ["M44 16 V84", "M44 40 H24", "M44 60 H24", "M64 16 V84"],
  },
  vowel_015: {
    hangul: "ㅘ",
    strokes: ["M34 28 V58", "M14 58 H62", "M62 16 V84", "M62 44 H80"],
  },
  vowel_016: {
    hangul: "ㅙ",
    strokes: [
      "M24 30 V60",
      "M8 60 H56",
      "M56 16 V84",
      "M56 44 H78",
      "M80 16 V84",
    ],
  },
  vowel_017: {
    hangul: "ㅚ",
    strokes: ["M38 30 V60", "M16 60 H62", "M62 16 V84"],
  },
  vowel_018: {
    hangul: "ㅝ",
    strokes: ["M14 56 H60", "M36 56 V78", "M60 16 V84", "M60 40 H44"],
  },
  vowel_019: {
    hangul: "ㅞ",
    strokes: [
      "M8 56 H56",
      "M28 56 V78",
      "M56 16 V84",
      "M56 38 H42",
      "M78 16 V84",
    ],
  },
  vowel_020: {
    hangul: "ㅟ",
    strokes: ["M14 52 H60", "M34 52 V78", "M60 16 V84"],
  },
  vowel_021: { hangul: "ㅢ", strokes: ["M14 50 H62", "M62 16 V84"] },
};

/** The stroke paths for one character, in writing order; empty when unknown. */
export function getHangulStrokes(characterId: string): readonly string[] {
  return HANGUL_STROKE_ORDER[characterId]?.strokes ?? [];
}

/** True when the character has stroke data, so a view can skip the diagram. */
export function hasHangulStrokes(characterId: string): boolean {
  return getHangulStrokes(characterId).length > 0;
}

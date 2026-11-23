export interface AlphabetCard {
  id: string;
  hangul: string;
  romanization: string;
  sound: string;
  example: string;
  type: "consonant" | "vowel";
}

const BASIC_CONSONANTS: AlphabetCard[] = [
  {
    id: "cons_001",
    hangul: "ㄱ",
    romanization: "g/k",
    sound: "기역",
    example: "가 (ga - house)",
    type: "consonant",
  },
  {
    id: "cons_002",
    hangul: "ㄴ",
    romanization: "n",
    sound: "니은",
    example: "나 (na - I)",
    type: "consonant",
  },
  {
    id: "cons_003",
    hangul: "ㄷ",
    romanization: "d/t",
    sound: "디귿",
    example: "다 (da - all)",
    type: "consonant",
  },
  {
    id: "cons_004",
    hangul: "ㄹ",
    romanization: "r/l",
    sound: "리을",
    example: "라 (ra - pull)",
    type: "consonant",
  },
  {
    id: "cons_005",
    hangul: "ㅁ",
    romanization: "m",
    sound: "미음",
    example: "마 (ma - horse)",
    type: "consonant",
  },
  {
    id: "cons_006",
    hangul: "ㅂ",
    romanization: "b/p",
    sound: "비읍",
    example: "바 (ba - wind)",
    type: "consonant",
  },
  {
    id: "cons_007",
    hangul: "ㅅ",
    romanization: "s",
    sound: "시옷",
    example: "사 (sa - four)",
    type: "consonant",
  },
  {
    id: "cons_008",
    hangul: "ㅇ",
    romanization: "ng",
    sound: "이응",
    example: "아 (a - I)",
    type: "consonant",
  },
  {
    id: "cons_009",
    hangul: "ㅈ",
    romanization: "j",
    sound: "지읒",
    example: "자 (ja - self)",
    type: "consonant",
  },
  {
    id: "cons_010",
    hangul: "ㅊ",
    romanization: "ch",
    sound: "치읓",
    example: "차 (cha - car)",
    type: "consonant",
  },
  {
    id: "cons_011",
    hangul: "ㅋ",
    romanization: "k",
    sound: "키읔",
    example: "카 (ka - card)",
    type: "consonant",
  },
  {
    id: "cons_012",
    hangul: "ㅌ",
    romanization: "t",
    sound: "티읕",
    example: "타 (ta - other)",
    type: "consonant",
  },
  {
    id: "cons_013",
    hangul: "ㅍ",
    romanization: "p",
    sound: "피읖",
    example: "파 (pa - wave)",
    type: "consonant",
  },
  {
    id: "cons_014",
    hangul: "ㅎ",
    romanization: "h",
    sound: "히읗",
    example: "하 (ha - do)",
    type: "consonant",
  },
];

const DOUBLE_CONSONANTS: AlphabetCard[] = [
  {
    id: "cons_015",
    hangul: "ㄲ",
    romanization: "kk",
    sound: "쌍기역",
    example: "까 (kka - peel)",
    type: "consonant",
  },
  {
    id: "cons_016",
    hangul: "ㄸ",
    romanization: "tt",
    sound: "쌍디귿",
    example: "따 (tta - follow)",
    type: "consonant",
  },
  {
    id: "cons_017",
    hangul: "ㅃ",
    romanization: "pp",
    sound: "쌍비읍",
    example: "빠 (ppa - fast)",
    type: "consonant",
  },
  {
    id: "cons_018",
    hangul: "ㅆ",
    romanization: "ss",
    sound: "쌍시옷",
    example: "싸 (ssa - cheap)",
    type: "consonant",
  },
  {
    id: "cons_019",
    hangul: "ㅉ",
    romanization: "jj",
    sound: "쌍지읒",
    example: "짜 (jja - salty)",
    type: "consonant",
  },
];

const BASIC_VOWELS: AlphabetCard[] = [
  {
    id: "vowel_001",
    hangul: "ㅏ",
    romanization: "a",
    sound: "아",
    example: "아 (a - I)",
    type: "vowel",
  },
  {
    id: "vowel_002",
    hangul: "ㅑ",
    romanization: "ya",
    sound: "야",
    example: "야 (ya - hey)",
    type: "vowel",
  },
  {
    id: "vowel_003",
    hangul: "ㅓ",
    romanization: "eo",
    sound: "어",
    example: "어 (eo - uh)",
    type: "vowel",
  },
  {
    id: "vowel_004",
    hangul: "ㅕ",
    romanization: "yeo",
    sound: "여",
    example: "여 (yeo - woman)",
    type: "vowel",
  },
  {
    id: "vowel_005",
    hangul: "ㅗ",
    romanization: "o",
    sound: "오",
    example: "오 (o - five)",
    type: "vowel",
  },
  {
    id: "vowel_006",
    hangul: "ㅛ",
    romanization: "yo",
    sound: "요",
    example: "요 (yo - ending)",
    type: "vowel",
  },
  {
    id: "vowel_007",
    hangul: "ㅜ",
    romanization: "u",
    sound: "우",
    example: "우 (u - rain)",
    type: "vowel",
  },
  {
    id: "vowel_008",
    hangul: "ㅠ",
    romanization: "yu",
    sound: "유",
    example: "유 (yu - oil)",
    type: "vowel",
  },
  {
    id: "vowel_009",
    hangul: "ㅡ",
    romanization: "eu",
    sound: "으",
    example: "으 (eu - sound)",
    type: "vowel",
  },
  {
    id: "vowel_010",
    hangul: "ㅣ",
    romanization: "i",
    sound: "이",
    example: "이 (i - this)",
    type: "vowel",
  },
];

const COMPOUND_VOWELS: AlphabetCard[] = [
  {
    id: "vowel_011",
    hangul: "ㅐ",
    romanization: "ae",
    sound: "애",
    example: "애 (ae - child)",
    type: "vowel",
  },
  {
    id: "vowel_012",
    hangul: "ㅒ",
    romanization: "yae",
    sound: "얘",
    example: "얘 (yae - this person)",
    type: "vowel",
  },
  {
    id: "vowel_013",
    hangul: "ㅔ",
    romanization: "e",
    sound: "에",
    example: "에 (e - at)",
    type: "vowel",
  },
  {
    id: "vowel_014",
    hangul: "ㅖ",
    romanization: "ye",
    sound: "예",
    example: "예 (ye - yes)",
    type: "vowel",
  },
  {
    id: "vowel_015",
    hangul: "ㅘ",
    romanization: "wa",
    sound: "와",
    example: "와 (wa - wow)",
    type: "vowel",
  },
  {
    id: "vowel_016",
    hangul: "ㅙ",
    romanization: "wae",
    sound: "왜",
    example: "왜 (wae - why)",
    type: "vowel",
  },
  {
    id: "vowel_017",
    hangul: "ㅚ",
    romanization: "oe",
    sound: "외",
    example: "외 (oe - outside)",
    type: "vowel",
  },
  {
    id: "vowel_018",
    hangul: "ㅝ",
    romanization: "wo",
    sound: "워",
    example: "워 (wo - sound)",
    type: "vowel",
  },
  {
    id: "vowel_019",
    hangul: "ㅞ",
    romanization: "we",
    sound: "웨",
    example: "웨 (we - way)",
    type: "vowel",
  },
  {
    id: "vowel_020",
    hangul: "ㅟ",
    romanization: "wi",
    sound: "위",
    example: "위 (wi - above)",
    type: "vowel",
  },
  {
    id: "vowel_021",
    hangul: "ㅢ",
    romanization: "ui",
    sound: "의",
    example: "의 (ui - of)",
    type: "vowel",
  },
];

export const ALPHABET_DATA: AlphabetCard[] = [
  ...BASIC_CONSONANTS,
  ...DOUBLE_CONSONANTS,
  ...BASIC_VOWELS,
  ...COMPOUND_VOWELS,
];

export type AlphabetCategoryId =
  | "basic-consonants"
  | "double-consonants"
  | "basic-vowels"
  | "compound-vowels";

export interface AlphabetCategory {
  id: AlphabetCategoryId;
  name: string;
  detail: string;
  color: string;
}

export const ALPHABET_CATEGORIES: readonly AlphabetCategory[] = [
  {
    id: "basic-consonants",
    name: "Basic consonants",
    detail: "14 letters",
    color: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  },
  {
    id: "double-consonants",
    name: "Double consonants",
    detail: "5 tense letters",
    color: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
  },
  {
    id: "basic-vowels",
    name: "Basic vowels",
    detail: "10 vowel sounds",
    color:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
  },
  {
    id: "compound-vowels",
    name: "Compound vowels",
    detail: "11 combined sounds",
    color:
      "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
  },
];

export function getAlphabetCategoryCards(
  categoryId: AlphabetCategoryId
): AlphabetCard[] {
  switch (categoryId) {
    case "basic-consonants":
      return BASIC_CONSONANTS;
    case "double-consonants":
      return DOUBLE_CONSONANTS;
    case "basic-vowels":
      return BASIC_VOWELS;
    case "compound-vowels":
      return COMPOUND_VOWELS;
  }
}

export const ALPHABET_CONSONANT_CARDS = [
  ...BASIC_CONSONANTS,
  ...DOUBLE_CONSONANTS,
];
export const ALPHABET_VOWEL_CARDS = [...BASIC_VOWELS, ...COMPOUND_VOWELS];

export const ALPHABET_COUNTS = {
  consonants: 19,
  vowels: 21,
  total: 40,
} as const;
export const ALPHABET_CATEGORY_DESCRIPTIONS = {
  consonants: "19 consonants · 14 basic + 5 double consonants",
  vowels: "21 vowels · 10 basic + 11 combined vowels",
} as const;
export const ALPHABET_FULL_INVENTORY_LABEL =
  "Full modern Hangul inventory · 40 characters";
export const ALPHABET_AUDIO_VOICE = "Yong Gyu - Calm Korean Male Narrator";
export const ALPHABET_AUDIO_VOICE_ID = "h5eZa8VFAq0EQ8E81dfL";
export const ALPHABET_AUDIO_MODEL = "eleven_v4";
export const ALPHABET_TTS_MODE = "letter-name" as const;
export const ALPHABET_AUDIO_TEXT: Record<string, string> = Object.fromEntries(
  ALPHABET_DATA.map(card => [card.id, card.sound])
);
/**
 * Clip keys used by the male alphabet index for basic characters, keyed by
 * domain id. The index also carries the ids, but older generated batches keyed
 * these clips by mnemonic; the audio manifest resolver tries the id first and
 * this alias second. Kept beside the alphabet metadata so ids and clip keys
 * stay together.
 */
export const ALPHABET_CONSONANT_AUDIO_ALIASES: Record<string, string> = {
  cons_001: "ga",
  cons_002: "na",
  cons_003: "da",
  cons_004: "ra",
  cons_005: "ma",
  cons_006: "ba",
  cons_007: "sa",
  cons_008: "a_consonant",
  cons_009: "ja",
  cons_010: "cha2",
  cons_011: "cha",
  cons_012: "kha",
  cons_013: "ta",
  cons_014: "pha",
  cons_015: "ha",
};

export const ALPHABET_VOWEL_AUDIO_ALIASES: Record<string, string> = {
  vowel_001: "a",
  vowel_002: "ya",
  vowel_003: "eo",
  vowel_004: "yeo",
  vowel_005: "o",
  vowel_006: "yo",
  vowel_007: "u",
  vowel_008: "yu",
  vowel_009: "eu",
  vowel_010: "i",
  vowel_011: "ae",
  vowel_012: "e",
};

export const ALPHABET_CARD_LOOKUP = Object.fromEntries(
  ALPHABET_DATA.map(card => [card.id, card])
);
export const ALPHABET_TOTAL = ALPHABET_DATA.length;
export const ALPHABET_CONSONANT_TOTAL = ALPHABET_CONSONANT_CARDS.length;
export const ALPHABET_VOWEL_TOTAL = ALPHABET_VOWEL_CARDS.length;
export const ALPHABET_DATASET_IS_COMPLETE =
  ALPHABET_TOTAL === 40 &&
  ALPHABET_CONSONANT_TOTAL === 19 &&
  ALPHABET_VOWEL_TOTAL === 21;
export const ALPHABET_LEARNING_NOTE =
  "Consonants are pronounced by their Korean letter names; for example, ㄴ is 니은 (nieun).";

export function getAlphabetAudioText(characterId: string): string {
  return ALPHABET_AUDIO_TEXT[characterId] ?? characterId;
}
export function getAlphabetCardCount(type: "consonants" | "vowels"): number {
  return type === "consonants"
    ? ALPHABET_CONSONANT_TOTAL
    : ALPHABET_VOWEL_TOTAL;
}
export function getAlphabetCards(
  type: "consonants" | "vowels"
): AlphabetCard[] {
  return type === "consonants"
    ? ALPHABET_CONSONANT_CARDS
    : ALPHABET_VOWEL_CARDS;
}

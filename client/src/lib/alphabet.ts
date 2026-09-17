export interface AlphabetCard { id: string; hangul: string; romanization: string; sound: string; ttsText: string; example: string; type: "consonant" | "vowel" | "number"; }

export const ALPHABET_DATA: AlphabetCard[] = [
  { id: "cons_001", hangul: "ㄱ", romanization: "g/k", sound: "기역", ttsText: "기역", example: "가 (ga - house)", type: "consonant" },
  { id: "cons_002", hangul: "ㄴ", romanization: "n", sound: "니은", ttsText: "니은", example: "나 (na - I)", type: "consonant" },
  { id: "cons_003", hangul: "ㄷ", romanization: "d/t", sound: "디귿", ttsText: "디귿", example: "다 (da - all)", type: "consonant" },
  { id: "cons_004", hangul: "ㄹ", romanization: "r/l", sound: "리을", ttsText: "리을", example: "라 (ra - pull)", type: "consonant" },
  { id: "cons_005", hangul: "ㅁ", romanization: "m", sound: "미음", ttsText: "미음", example: "마 (ma - horse)", type: "consonant" },
  { id: "cons_006", hangul: "ㅂ", romanization: "b/p", sound: "비읍", ttsText: "비읍", example: "바 (ba - wind)", type: "consonant" },
  { id: "cons_007", hangul: "ㅅ", romanization: "s", sound: "시옷", ttsText: "시옷", example: "사 (sa - four)", type: "consonant" },
  { id: "cons_008", hangul: "ㅇ", romanization: "ng", sound: "이응", ttsText: "이응", example: "아 (a - I)", type: "consonant" },
  { id: "cons_009", hangul: "ㅈ", romanization: "j", sound: "지읒", ttsText: "지읒", example: "자 (ja - self)", type: "consonant" },
  { id: "cons_010", hangul: "ㅊ", romanization: "ch", sound: "치읓", ttsText: "치읓", example: "차 (cha - car)", type: "consonant" },
  { id: "cons_011", hangul: "ㅋ", romanization: "k", sound: "키읔", ttsText: "키읔", example: "카 (ka - card)", type: "consonant" },
  { id: "cons_012", hangul: "ㅌ", romanization: "t", sound: "티읕", ttsText: "티읕", example: "타 (ta - other)", type: "consonant" },
  { id: "cons_013", hangul: "ㅍ", romanization: "p", sound: "피읖", ttsText: "피읖", example: "파 (pa - wave)", type: "consonant" },
  { id: "cons_014", hangul: "ㅎ", romanization: "h", sound: "히읗", ttsText: "히읗", example: "하 (ha - do)", type: "consonant" },
  { id: "cons_015", hangul: "ㄲ", romanization: "kk", sound: "쌍기역", ttsText: "쌍기역", example: "까 (kka - peel)", type: "consonant" },
  { id: "cons_016", hangul: "ㄸ", romanization: "tt", sound: "쌍디귿", ttsText: "쌍디귿", example: "따 (tta - follow)", type: "consonant" },
  { id: "cons_017", hangul: "ㅃ", romanization: "pp", sound: "쌍비읍", ttsText: "쌍비읍", example: "빠 (ppa - fast)", type: "consonant" },
  { id: "cons_018", hangul: "ㅆ", romanization: "ss", sound: "쌍시옷", ttsText: "쌍시옷", example: "싸 (ssa - cheap)", type: "consonant" },
  { id: "cons_019", hangul: "ㅉ", romanization: "jj", sound: "쌍지읒", ttsText: "쌍지읒", example: "짜 (jja - salty)", type: "consonant" },
  { id: "vowel_001", hangul: "ㅏ", romanization: "a", sound: "아", ttsText: "아", example: "아 (a - I)", type: "vowel" },
  { id: "vowel_002", hangul: "ㅑ", romanization: "ya", sound: "야", ttsText: "야", example: "야 (ya - hey)", type: "vowel" },
  { id: "vowel_003", hangul: "ㅓ", romanization: "eo", sound: "어", ttsText: "어", example: "어 (eo - uh)", type: "vowel" },
  { id: "vowel_004", hangul: "ㅕ", romanization: "yeo", sound: "여", ttsText: "여", example: "여 (yeo - woman)", type: "vowel" },
  { id: "vowel_005", hangul: "ㅗ", romanization: "o", sound: "오", ttsText: "오", example: "오 (o - five)", type: "vowel" },
  { id: "vowel_006", hangul: "ㅛ", romanization: "yo", sound: "요", ttsText: "요", example: "요 (yo - ending)", type: "vowel" },
  { id: "vowel_007", hangul: "ㅜ", romanization: "u", sound: "우", ttsText: "우", example: "우 (u - rain)", type: "vowel" },
  { id: "vowel_008", hangul: "ㅠ", romanization: "yu", sound: "유", ttsText: "유", example: "유 (yu - oil)", type: "vowel" },
  { id: "vowel_009", hangul: "ㅡ", romanization: "eu", sound: "으", ttsText: "으", example: "으 (eu - sound)", type: "vowel" },
  { id: "vowel_010", hangul: "ㅣ", romanization: "i", sound: "이", ttsText: "이", example: "이 (i - this)", type: "vowel" },
  { id: "vowel_011", hangul: "ㅐ", romanization: "ae", sound: "애", ttsText: "애", example: "애 (ae - child)", type: "vowel" },
  { id: "vowel_012", hangul: "ㅒ", romanization: "yae", sound: "얘", ttsText: "얘", example: "얘 (yae - this person)", type: "vowel" },
  { id: "vowel_013", hangul: "ㅔ", romanization: "e", sound: "에", ttsText: "에", example: "에 (e - at)", type: "vowel" },
  { id: "vowel_014", hangul: "ㅖ", romanization: "ye", sound: "예", ttsText: "예", example: "예 (ye - yes)", type: "vowel" },
  { id: "vowel_015", hangul: "ㅘ", romanization: "wa", sound: "와", ttsText: "와", example: "와 (wa - wow)", type: "vowel" },
  { id: "vowel_016", hangul: "ㅙ", romanization: "wae", sound: "왜", ttsText: "왜", example: "왜 (wae - why)", type: "vowel" },
  { id: "vowel_017", hangul: "ㅚ", romanization: "oe", sound: "외", ttsText: "외", example: "외 (oe - outside)", type: "vowel" },
  { id: "vowel_018", hangul: "ㅝ", romanization: "wo", sound: "워", ttsText: "워", example: "워 (wo - sound)", type: "vowel" },
  { id: "vowel_019", hangul: "ㅞ", romanization: "we", sound: "웨", ttsText: "웨", example: "웨 (we - way)", type: "vowel" },
  { id: "vowel_020", hangul: "ㅟ", romanization: "wi", sound: "위", ttsText: "위", example: "위 (wi - above)", type: "vowel" },
  { id: "vowel_021", hangul: "ㅢ", romanization: "ui", sound: "의", ttsText: "의", example: "의 (ui - of)", type: "vowel" },
];

export const ALPHABET_CATEGORIES = [
  { id: "consonants", name: "Consonants", icon: "🔤", color: "bg-blue-100 text-blue-700" },
  { id: "vowels", name: "Vowels", icon: "🎵", color: "bg-purple-100 text-purple-700" },
  { id: "numbers", name: "Numbers", icon: "123", color: "bg-emerald-100 text-emerald-700" },
];

export const NUMBER_DATA: AlphabetCard[] = [
  { id: "num_001", hangul: "하나", romanization: "hana", sound: "One", ttsText: "하나", example: "하나, 둘, 셋", type: "number" },
  { id: "num_002", hangul: "둘", romanization: "dul", sound: "Two", ttsText: "둘", example: "둘이 함께 갔어요.", type: "number" },
  { id: "num_003", hangul: "셋", romanization: "set", sound: "Three", ttsText: "셋", example: "셋이 모였어요.", type: "number" },
  { id: "num_004", hangul: "넷", romanization: "net", sound: "Four", ttsText: "넷", example: "넷은 너무 많아요.", type: "number" },
  { id: "num_005", hangul: "다섯", romanization: "daseot", sound: "Five", ttsText: "다섯", example: "다섯 명이 왔어요.", type: "number" },
  { id: "num_006", hangul: "여섯", romanization: "yeoseot", sound: "Six", ttsText: "여섯", example: "여섯 시간이 걸렸어요.", type: "number" },
  { id: "num_007", hangul: "일곱", romanization: "ilgop", sound: "Seven", ttsText: "일곱", example: "일곱 살이 되었어요.", type: "number" },
  { id: "num_008", hangul: "여덟", romanization: "yeodeol", sound: "Eight", ttsText: "여덟", example: "여덟 개를 샀어요.", type: "number" },
  { id: "num_009", hangul: "아홉", romanization: "ahop", sound: "Nine", ttsText: "아홉", example: "아홉 번 했어요.", type: "number" },
  { id: "num_010", hangul: "열", romanization: "yeol", sound: "Ten", ttsText: "열", example: "열 개를 주세요.", type: "number" },
];

export const ALPHABET_COUNTS = { consonants: 19, vowels: 21, total: 40 } as const;
export const ALPHABET_CATEGORY_DESCRIPTIONS = { consonants: "19 consonants · 14 basic + 5 double consonants", vowels: "21 vowels · 10 basic + 11 combined vowels" } as const;
export const ALPHABET_FULL_INVENTORY_LABEL = "Full modern Hangul inventory · 40 characters";
export const ALPHABET_AUDIO_VOICE = "Hyuk - Cold and Clear";
export const ALPHABET_AUDIO_VOICE_ID = "ZJCNdZEjYwkOElxugmW2";
export const ALPHABET_AUDIO_MODEL = "eleven_multilingual_v2";
export const ALPHABET_TTS_MODE = "letter-name" as const;
export const ALPHABET_AUDIO_TEXT: Record<string, string> = Object.fromEntries(ALPHABET_DATA.map((card) => [card.id, card.ttsText]));
export const ALPHABET_CONSONANT_CARDS = ALPHABET_DATA.filter((card) => card.type === "consonant");
export const ALPHABET_VOWEL_CARDS = ALPHABET_DATA.filter((card) => card.type === "vowel");
export const ALPHABET_CARD_LOOKUP = Object.fromEntries(ALPHABET_DATA.map((card) => [card.id, card]));
export const ALPHABET_TOTAL = ALPHABET_DATA.length;
export const ALPHABET_CONSONANT_TOTAL = ALPHABET_CONSONANT_CARDS.length;
export const ALPHABET_VOWEL_TOTAL = ALPHABET_VOWEL_CARDS.length;
export const ALPHABET_DATASET_IS_COMPLETE = ALPHABET_TOTAL === 40 && ALPHABET_CONSONANT_TOTAL === 19 && ALPHABET_VOWEL_TOTAL === 21;
export const ALPHABET_LEARNING_NOTE = "Consonants are pronounced by their Korean letter names; for example, ㄴ is 니은 (nieun).";

export function getAlphabetAudioText(characterId: string): string { return ALPHABET_AUDIO_TEXT[characterId] ?? characterId; }
export function getAlphabetCardCount(type: "consonants" | "vowels"): number { return type === "consonants" ? ALPHABET_CONSONANT_TOTAL : ALPHABET_VOWEL_TOTAL; }
export function getAlphabetCards(type: "consonants" | "vowels"): AlphabetCard[] { return type === "consonants" ? ALPHABET_CONSONANT_CARDS : ALPHABET_VOWEL_CARDS; }

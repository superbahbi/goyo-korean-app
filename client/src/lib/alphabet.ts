export interface AlphabetCard {
  id: string;
  hangul: string;
  romanization: string;
  sound: string;
  example: string;
  type: "consonant" | "vowel";
}

export const ALPHABET_DATA: AlphabetCard[] = [
  // Consonants (자음)
  { id: "cons_001", hangul: "ㄱ", romanization: "g/k", sound: "gieuk", example: "가 (ga - house)", type: "consonant" },
  { id: "cons_002", hangul: "ㄴ", romanization: "n", sound: "nieun", example: "나 (na - I)", type: "consonant" },
  { id: "cons_003", hangul: "ㄷ", romanization: "d/t", sound: "digeut", example: "다 (da - all)", type: "consonant" },
  { id: "cons_004", hangul: "ㄹ", romanization: "r/l", sound: "rieul", example: "라 (ra - pull)", type: "consonant" },
  { id: "cons_005", hangul: "ㅁ", romanization: "m", sound: "mieum", example: "마 (ma - horse)", type: "consonant" },
  { id: "cons_006", hangul: "ㅂ", romanization: "b/p", sound: "bieup", example: "바 (ba - wind)", type: "consonant" },
  { id: "cons_007", hangul: "ㅅ", romanization: "s", sound: "siot", example: "사 (sa - four)", type: "consonant" },
  { id: "cons_008", hangul: "ㅇ", romanization: "ng", sound: "ieung", example: "아 (a - I)", type: "consonant" },
  { id: "cons_009", hangul: "ㅈ", romanization: "j", sound: "jieut", example: "자 (ja - self)", type: "consonant" },
  { id: "cons_010", hangul: "ㅉ", romanization: "jj", sound: "ssangjieut", example: "짜 (jja - tea)", type: "consonant" },
  { id: "cons_011", hangul: "ㅊ", romanization: "ch", sound: "chieut", example: "차 (cha - car)", type: "consonant" },
  { id: "cons_012", hangul: "ㅋ", romanization: "kh", sound: "khieuk", example: "카 (ka - card)", type: "consonant" },
  { id: "cons_013", hangul: "ㅌ", romanization: "th", sound: "thieut", example: "타 (ta - other)", type: "consonant" },
  { id: "cons_014", hangul: "ㅍ", romanization: "ph", sound: "phieup", example: "파 (pa - wave)", type: "consonant" },
  { id: "cons_015", hangul: "ㅎ", romanization: "h", sound: "hieuh", example: "하 (ha - do)", type: "consonant" },

  // Vowels (모음)
  { id: "vowel_001", hangul: "ㅏ", romanization: "a", sound: "a", example: "아 (a - I)", type: "vowel" },
  { id: "vowel_002", hangul: "ㅑ", romanization: "ya", sound: "ya", example: "야 (ya - night)", type: "vowel" },
  { id: "vowel_003", hangul: "ㅓ", romanization: "eo", sound: "eo", example: "어 (eo - language)", type: "vowel" },
  { id: "vowel_004", hangul: "ㅕ", romanization: "yeo", sound: "yeo", example: "여 (yeo - woman)", type: "vowel" },
  { id: "vowel_005", hangul: "ㅗ", romanization: "o", sound: "o", example: "오 (o - five)", type: "vowel" },
  { id: "vowel_006", hangul: "ㅛ", romanization: "yo", sound: "yo", example: "요 (yo - night)", type: "vowel" },
  { id: "vowel_007", hangul: "ㅜ", romanization: "u", sound: "u", example: "우 (u - rain)", type: "vowel" },
  { id: "vowel_008", hangul: "ㅠ", romanization: "yu", sound: "yu", example: "유 (yu - oil)", type: "vowel" },
  { id: "vowel_009", hangul: "ㅡ", romanization: "eu", sound: "eu", example: "은 (eun - silver)", type: "vowel" },
  { id: "vowel_010", hangul: "ㅣ", romanization: "i", sound: "i", example: "이 (i - this)", type: "vowel" },
  { id: "vowel_011", hangul: "ㅐ", romanization: "ae", sound: "ae", example: "애 (ae - child)", type: "vowel" },
  { id: "vowel_012", hangul: "ㅔ", romanization: "e", sound: "e", example: "에 (e - at)", type: "vowel" },
];

export const ALPHABET_CATEGORIES = [
  { id: "consonants", name: "Consonants", icon: "🔤", color: "bg-blue-100 text-blue-700" },
  { id: "vowels", name: "Vowels", icon: "🎵", color: "bg-purple-100 text-purple-700" },
];

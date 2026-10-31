// Revised Romanization for Hangul headwords (practical subset).
// Implemented: syllable decomposition, initial/vowel/final tables, liaison (연음),
// final-consonant neutralization, nasal assimilation before ㄴ/ㅁ, ㅎ aspiration,
// ㄷ/ㅌ + 이 palatalization (ji/chi), and ㄹ as r or l.
// Not implemented: ㄹ-ㄴ assimilation (설날 gives seolnal, not seollal), ㅅ-ㅎ
// tensing, and cross-word liaison. Spaces in the input are kept and words are
// romanized separately.

const CHO = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const JUNG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const JONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const VOWEL: Record<string, string> = {
  ㅏ: "a",
  ㅐ: "ae",
  ㅑ: "ya",
  ㅒ: "yae",
  ㅓ: "eo",
  ㅔ: "e",
  ㅕ: "yeo",
  ㅖ: "ye",
  ㅗ: "o",
  ㅘ: "wa",
  ㅙ: "wae",
  ㅚ: "oe",
  ㅛ: "yo",
  ㅜ: "u",
  ㅝ: "wo",
  ㅞ: "we",
  ㅟ: "wi",
  ㅠ: "yu",
  ㅡ: "eu",
  ㅢ: "ui",
  ㅣ: "i",
};

const INITIAL: Record<string, string> = {
  ㄱ: "g",
  ㄲ: "kk",
  ㄴ: "n",
  ㄷ: "d",
  ㄸ: "tt",
  ㄹ: "r",
  ㅁ: "m",
  ㅂ: "b",
  ㅃ: "pp",
  ㅅ: "s",
  ㅆ: "ss",
  ㅇ: "",
  ㅈ: "j",
  ㅉ: "jj",
  ㅊ: "ch",
  ㅋ: "k",
  ㅌ: "t",
  ㅍ: "p",
  ㅎ: "h",
};

// A final consonant moved into the next syllable's onset (liaison). ㅎ is silent.
const LIAISON_ONSET: Record<string, string> = {
  ㄱ: "g",
  ㄲ: "kk",
  ㄴ: "n",
  ㄷ: "d",
  ㄸ: "tt",
  ㄹ: "r",
  ㅁ: "m",
  ㅂ: "b",
  ㅅ: "s",
  ㅆ: "ss",
  ㅈ: "j",
  ㅊ: "ch",
  ㅋ: "k",
  ㅌ: "t",
  ㅍ: "p",
  ㅎ: "",
};

const NEUTRAL_CODA: Record<string, string> = {
  ㄱ: "k",
  ㄲ: "k",
  ㅋ: "k",
  ㄳ: "k",
  ㄺ: "k",
  ㄷ: "t",
  ㅌ: "t",
  ㅅ: "t",
  ㅆ: "t",
  ㅈ: "t",
  ㅊ: "t",
  ㅎ: "t",
  ㄴ: "n",
  ㄵ: "n",
  ㄶ: "n",
  ㄹ: "l",
  ㄼ: "l",
  ㄽ: "l",
  ㄾ: "l",
  ㅀ: "l",
  ㅁ: "m",
  ㄻ: "m",
  ㅂ: "p",
  ㅍ: "p",
  ㅄ: "p",
  ㄿ: "p",
  ㅇ: "ng",
};

// Compound finals: [part left on the syllable, part carried by liaison].
const COMPOUND_FINAL: Record<string, [string, string]> = {
  ㄳ: ["ㄱ", "ㅅ"],
  ㄵ: ["ㄴ", "ㅈ"],
  ㄶ: ["ㄴ", "ㅎ"],
  ㄺ: ["ㄹ", "ㄱ"],
  ㄻ: ["ㄹ", "ㅁ"],
  ㄼ: ["ㄹ", "ㅂ"],
  ㄽ: ["ㄹ", "ㅅ"],
  ㄾ: ["ㄹ", "ㅌ"],
  ㄿ: ["ㄹ", "ㅍ"],
  ㅀ: ["ㄹ", "ㅎ"],
  ㅄ: ["ㅂ", "ㅅ"],
};

const NASAL_NG = ["ㄱ", "ㄲ", "ㅋ", "ㄳ", "ㄺ"];
const NASAL_N = ["ㄷ", "ㅌ", "ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅎ"];
const NASAL_M = ["ㅂ", "ㅍ", "ㅄ"];
// Final ㅎ (ㅎ, ㄶ, ㅀ) before these onsets aspirates them.
const ASPIRATE: Record<string, string> = { ㄱ: "k", ㄷ: "t", ㅈ: "ch" };
const H_FINAL_LEFT: Record<string, string> = { ㅎ: "", ㄶ: "n", ㅀ: "l" };

interface Syllable {
  cho: string;
  jung: string;
  jong: string;
}

function decompose(word: string): Syllable[] {
  return Array.from(word, ch => {
    const code = ch.codePointAt(0)! - 0xac00;
    if (code < 0 || code > 11171)
      throw new Error(`Not a Hangul syllable: "${ch}" in "${word}"`);
    return {
      cho: CHO[Math.floor(code / 588)],
      jung: JUNG[Math.floor((code % 588) / 28)],
      jong: JONG[code % 28],
    };
  });
}

function romanizeWord(word: string): string {
  const syls = decompose(word);
  const count = syls.length;
  const coda: string[] = new Array(count).fill("");
  const carried: (string | undefined)[] = new Array(count);
  const onsetOverride: (string | undefined)[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const { jong } = syls[i];
    const next = syls[i + 1];
    if (!jong) continue;

    if (next && next.cho === "ㅇ") {
      if (jong === "ㅇ") {
        coda[i] = "ng";
      } else if (COMPOUND_FINAL[jong]) {
        const [left, moved] = COMPOUND_FINAL[jong];
        if (moved === "ㅎ") {
          carried[i + 1] = left;
        } else {
          coda[i] = NEUTRAL_CODA[left];
          carried[i + 1] = moved;
        }
      } else {
        carried[i + 1] = jong;
      }
      continue;
    }

    const nextCho = next?.cho;
    if (jong === "ㄵ" && nextCho === "ㄷ") {
      // 앉다 is romanized anta: the ㄴ stays as coda and the ㅈ surfaces as t.
      coda[i] = "n";
      onsetOverride[i + 1] = "t";
    } else if (
      nextCho &&
      H_FINAL_LEFT[jong] !== undefined &&
      ASPIRATE[nextCho]
    ) {
      coda[i] = H_FINAL_LEFT[jong];
      onsetOverride[i + 1] = ASPIRATE[nextCho];
    } else if (nextCho === "ㄴ" || nextCho === "ㅁ") {
      if (NASAL_NG.includes(jong)) coda[i] = "ng";
      else if (NASAL_N.includes(jong)) coda[i] = "n";
      else if (NASAL_M.includes(jong)) coda[i] = "m";
      else coda[i] = NEUTRAL_CODA[jong];
    } else {
      coda[i] = NEUTRAL_CODA[jong];
    }
  }

  let out = "";
  for (let i = 0; i < count; i++) {
    const { cho, jung } = syls[i];
    let onset: string;
    if (onsetOverride[i] !== undefined) {
      onset = onsetOverride[i]!;
    } else if (carried[i] !== undefined) {
      const moved = carried[i]!;
      onset =
        (moved === "ㄷ" || moved === "ㅌ") && jung === "ㅣ"
          ? moved === "ㄷ"
            ? "j"
            : "ch"
          : LIAISON_ONSET[moved];
    } else if (cho === "ㄹ") {
      onset = i > 0 && syls[i - 1].jong ? "l" : "r";
    } else {
      onset = INITIAL[cho];
    }
    out += onset + VOWEL[jung] + coda[i];
  }
  return out;
}

export function romanize(text: string): string {
  return (
    text
      .trim()
      .split(/\s+/)
      // Romanize Hangul runs only, so punctuation and mixed text pass through.
      .map(word => word.replace(/[가-힣]+/g, romanizeWord))
      .join(" ")
  );
}

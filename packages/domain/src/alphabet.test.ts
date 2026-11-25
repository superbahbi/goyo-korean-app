import { describe, it, expect } from "vitest";
import {
  ALPHABET_CATEGORIES,
  ALPHABET_DATA,
  getAlphabetCategoryCards,
  splitAlphabetExample,
} from "./alphabet";
import { romanize } from "./romanize";

// Compatibility jamo in the order Unicode composes a syllable from them.
const INITIALS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const MEDIALS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";

function firstSyllableJamo(word: string) {
  const index = word.charCodeAt(0) - 0xac00;
  if (index < 0 || index > 11171) {
    throw new Error(`${word} does not start with a Hangul syllable`);
  }
  return {
    initial: INITIALS[Math.floor(index / 588)],
    medial: MEDIALS[Math.floor((index % 588) / 28)],
  };
}

describe("Hangul alphabet categories", () => {
  it("splits consonants into 14 basic and 5 double letters", () => {
    expect(getAlphabetCategoryCards("basic-consonants")).toHaveLength(14);
    expect(getAlphabetCategoryCards("double-consonants")).toHaveLength(5);
  });

  it("splits vowels into 10 basic and 11 compound letters", () => {
    expect(getAlphabetCategoryCards("basic-vowels")).toHaveLength(10);
    expect(getAlphabetCategoryCards("compound-vowels")).toHaveLength(11);
  });

  it("covers every alphabet card exactly once", () => {
    const categoryIds = ALPHABET_CATEGORIES.flatMap(category =>
      getAlphabetCategoryCards(category.id).map(card => card.id)
    ).sort();

    expect(categoryIds).toEqual(ALPHABET_DATA.map(card => card.id).sort());
  });
});

describe("Hangul alphabet examples", () => {
  // "가방 (gabang - bag)": a whole word, its romanization, and a gloss.
  const EXAMPLE = /^([가-힣]+) \(([a-z]+) - ([A-Za-z][A-Za-z ,]*)\)$/;

  it.each(ALPHABET_DATA)(
    "$hangul cites a word that begins with its own letter",
    card => {
      const match = EXAMPLE.exec(card.example);
      expect(match, card.example).not.toBeNull();
      const [, word, romanization] = match!;
      const { initial, medial } = firstSyllableJamo(word);

      // A consonant opens the word; a vowel is the first syllable's vowel.
      expect(card.type === "consonant" ? initial : medial).toBe(card.hangul);
      expect(romanization).toBe(romanize(word));
    }
  );

  it("splits an example into the Korean word and its gloss", () => {
    expect(splitAlphabetExample("가방 (gabang - bag)")).toEqual({
      word: "가방",
      gloss: "(gabang - bag)",
    });
    expect(splitAlphabetExample("가방")).toEqual({ word: "가방", gloss: "" });
  });
});

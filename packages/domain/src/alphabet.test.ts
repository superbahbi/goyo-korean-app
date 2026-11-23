import { describe, it, expect } from "vitest";
import {
  ALPHABET_CATEGORIES,
  ALPHABET_DATA,
  getAlphabetCategoryCards,
} from "./alphabet";

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

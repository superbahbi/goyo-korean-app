import { describe, expect, it } from "vitest";
import { ESSENTIAL_FREQUENCY_IDS } from "./essentialFrequency";
import { ESSENTIAL_THEME_IDS } from "./essentialTaxonomy";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";
import { CATEGORIES } from "./vocabulary";

const deckIds = ESSENTIAL_WORDS.map(card => card.id);
const themedIds = Object.values(ESSENTIAL_THEME_IDS).flat();

describe("imported deck themes", () => {
  it("assigns every imported card to exactly one theme", () => {
    expect(new Set(themedIds).size).toBe(themedIds.length);
    expect([...themedIds].sort()).toEqual([...deckIds].sort());
  });

  it("uses only themes the UI knows", () => {
    const categoryIds = new Set(CATEGORIES.map(category => category.id));
    for (const theme of Object.keys(ESSENTIAL_THEME_IDS)) {
      expect(categoryIds.has(theme), theme).toBe(true);
    }
    for (const card of ESSENTIAL_WORDS) {
      expect(categoryIds.has(card.tag), card.id).toBe(true);
    }
  });
});

describe("imported deck frequency order", () => {
  it("ranks every imported card exactly once", () => {
    expect(new Set(ESSENTIAL_FREQUENCY_IDS).size).toBe(
      ESSENTIAL_FREQUENCY_IDS.length
    );
    expect([...ESSENTIAL_FREQUENCY_IDS].sort()).toEqual([...deckIds].sort());
  });

  it("gives every imported card a unique rank", () => {
    const ranks = ESSENTIAL_WORDS.map(card => card.frequencyRank);
    expect(ranks.every(rank => typeof rank === "number")).toBe(true);
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});

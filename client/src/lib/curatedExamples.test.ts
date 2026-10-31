import { describe, it, expect } from "vitest";
import { CURATED_CARDS } from "./vocabulary";
import { NUMBER_DATA } from "./alphabet";

const BANNED_PHRASES = ["영어를 도와주세요", "넷은 너무 많아요"];

describe("curated examples", () => {
  it("avoids known unnatural phrases", () => {
    for (const card of CURATED_CARDS)
      for (const phrase of BANNED_PHRASES)
        expect(card.example, card.id).not.toContain(phrase);
  });

  it("uses the 나는 sentence template at most twice", () => {
    const templateCount = CURATED_CARDS.filter(card =>
      card.example.startsWith("나는 ")
    ).length;
    expect(templateCount).toBeLessThanOrEqual(2);
  });

  it("gives every card a non-empty example and a distinct English translation", () => {
    for (const card of CURATED_CARDS) {
      expect(card.example.trim(), card.id).not.toBe("");
      expect(card.exampleEnglish?.trim(), card.id).toBeTruthy();
      expect(card.exampleEnglish, card.id).not.toBe(card.example);
    }
  });
});

describe("alphabet number examples", () => {
  it("avoids known unnatural phrases", () => {
    for (const card of NUMBER_DATA)
      for (const phrase of BANNED_PHRASES)
        expect(card.example, card.id).not.toContain(phrase);
  });
});

import { describe, it, expect } from "vitest";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";

// The Essential 600 import tagged every descriptive word (형용사) as "verb".
// The audited sample cards were fixed first; these are the remaining 40
// adjectives the Phase 3 audit proved were still mistagged.
const DESCRIPTIVE_IDS = [
  "essential_479", // 짧다
  "essential_480", // 키가 크다
  "essential_481", // 키가 작다
  "essential_482", // 넓다
  "essential_483", // 크다
  "essential_484", // 작다
  "essential_485", // 느리다
  "essential_486", // 빠르다
  "essential_488", // 차갑다
  "essential_489", // 따뜻하다
  "essential_490", // 선선하다
  "essential_491", // 새롭다
  "essential_492", // 오래되다
  "essential_493", // 젊다
  "essential_495", // 좋다
  "essential_496", // 나쁘다
  "essential_499", // 아프다
  "essential_501", // 시끄럽다
  "essential_502", // 조용하다
  "essential_503", // 행복하다
  "essential_509", // 착하다
  "essential_510", // 가난하다
  "essential_511", // 부유하다
  "essential_512", // 두껍다
  "essential_513", // 얇다
  "essential_514", // 비싸다
  "essential_515", // 싸다
  "essential_521", // 낮다
  "essential_522", // 딱딱하다
  "essential_523", // 부드럽다
  "essential_524", // 깊다
  "essential_526", // 깨끗하다
  "essential_527", // 더럽다
  "essential_528", // 힘이 세다
  "essential_529", // 약하다
  "essential_531", // 무겁다
  "essential_532", // 가볍다
  "essential_533", // 어둡다
  "essential_534", // 밝다
  "essential_535", // 인기가 많다
] as const;

const byId = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

describe("essential deck parts of speech", () => {
  it("tags every proven descriptive card as an adjective", () => {
    for (const id of DESCRIPTIVE_IDS) {
      const card = byId.get(id);
      expect(card, `${id} is missing from ESSENTIAL_WORDS`).toBeDefined();
      expect(card!.partOfSpeech, `${id} (${card!.front})`).toBe("adjective");
    }
  });

  it("never leaves a descriptive card tagged as a verb", () => {
    for (const id of DESCRIPTIVE_IDS) {
      const card = byId.get(id);
      expect(card, `${id} is missing from ESSENTIAL_WORDS`).toBeDefined();
      expect(card!.partOfSpeech, `${id} (${card!.front})`).not.toBe("verb");
    }
  });

  it("keeps the descriptive cards' content unchanged", () => {
    for (const id of DESCRIPTIVE_IDS) {
      const card = byId.get(id);
      expect(card!.example.trim(), `${id} example`).not.toBe("");
      expect(card!.exampleEnglish?.trim(), `${id} exampleEnglish`).toBeTruthy();
      expect(card!.romanization.trim(), `${id} romanization`).not.toBe("");
    }
  });

  // Regression guard: "to be …" glosses are the clearest signal of a
  // descriptive word in this deck, so every retagged card should carry one.
  // No stricter global rule is enforced: some true verbs also gloss as
  // "to be …" (구부러지다 "to be bent"), and they stay verbs.
  it("retags only cards that gloss as descriptive ('to be …')", () => {
    for (const id of DESCRIPTIVE_IDS) {
      const card = byId.get(id);
      expect(
        card!.back.toLowerCase().startsWith("to be "),
        `${id} (${card!.front}) gloss: ${card!.back}`
      ).toBe(true);
    }
  });
});

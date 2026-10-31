import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";

const byId = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

function card(id: string) {
  const value = byId.get(id);
  if (!value) throw new Error(`missing ${id}`);
  return value;
}

// Residual defects found while reviewing PRs #31–#33 and the merged audits.
describe("Phase 3 post-close content fixes", () => {
  it("uses the standard headwords for yellow, juice and ballpoint pen", () => {
    const yellow = card("essential_069");
    expect(yellow.front).toBe("노란색");
    expect(yellow.romanization).toBe("noransaek");
    expect(yellow.example).toContain("노란색");

    const juice = card("essential_171");
    expect(juice.front).toBe("주스");
    expect(juice.romanization).toBe("juseu");
    expect(juice.example).toContain("주스");

    const pen = card("essential_215");
    expect(pen.front).toBe("볼펜");
    expect(pen.romanization).toBe("bolpen");
    expect(pen.example).toContain("볼펜");
  });

  it("does not present its own headword as a nonstandard spelling", () => {
    for (const id of ["essential_069", "essential_171", "essential_215"]) {
      const value = card(id);
      expect(value.usageNote ?? "", id).not.toContain("standard spelling");
    }
  });

  it("finishes the tongue example politely and completely", () => {
    const tongue = card("essential_262");
    expect(tongue.example).toBe("의사가 제 혀를 살펴보셨어요.");
    expect(tongue.exampleEnglish).toBe("The doctor examined my tongue.");
  });

  it("uses vowel letters, not syllables, in the vowel example", () => {
    const vowel = card("essential_336");
    expect(vowel.example).toContain("ㅏ");
    expect(vowel.example).not.toContain("아, 야");
    expect(vowel.exampleEnglish).toContain("ㅏ");
  });

  it("does not model an insult in the ugly example", () => {
    const ugly = card("essential_506");
    expect(ugly.example).not.toContain("배우");
    expect(ugly.example).toContain("괴물");
  });

  it("gives the ring card one clean gloss", () => {
    const ring = card("essential_518");
    expect(ring.back).toBe("to put on (a ring); to wear");
    expect(ring.exampleEnglish).not.toContain("(wore");
  });

  it("romanizes 나뭇잎 with ㄴ 첨가", () => {
    expect(card("essential_300").romanization).toBe("namunnip");
  });
});

import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";
import { romanize } from "./romanize";

const byId = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

function card(id: string) {
  const value = byId.get(id);
  if (!value) throw new Error(`missing ${id}`);
  return value;
}

// Defects found by the first Phase 7 sweep batch, recorded in
// docs/audits/essential-sample-5.json.
describe("Phase 7 sweep batch 1 fixes", () => {
  it("describes both the nightlife and hobby senses of 클럽", () => {
    const club = card("essential_039");
    expect(club.usageNote).toContain("축구 클럽");
    expect(club.usageNote).not.toMatch(/English contexts/);
  });

  it("shows the 애기 spelling in its own example", () => {
    const baby = card("essential_083");
    expect(baby.example).toContain("애기가");
    expect(baby.example).not.toContain("아기는");
  });

  it("keeps sports matches out of the 게임 note", () => {
    const game = card("essential_155");
    expect(game.usageNote).toContain("경기");
    expect(game.usageNote).not.toMatch(/sports games/);
  });

  it("keeps the 가격 translation natural", () => {
    const price = card("essential_156");
    expect(price.exampleEnglish).toBe("This product is a bit expensive.");
    expect(price.exampleEnglish).not.toMatch(/price is a bit expensive/);
  });

  it("gives the seed card a sentence that makes sense", () => {
    const seed = card("essential_190");
    expect(seed.example).toContain("꽃씨를 심으면");
    expect(seed.example).not.toContain("가시");
    expect(seed.usageNote).toContain("김 씨");
    expect(seed.usageNote).not.toMatch(/rude/);
  });

  it("uses the standard spaced ordinal for 네 번째", () => {
    const fourth = card("essential_373");
    expect(fourth.front).toBe("네 번째");
    expect(fourth.romanization).toBe("ne beonjjae");
    expect(fourth.partOfSpeech).toBe("number");
    expect(fourth.example).toContain("네 번째");
    expect(romanize("네 번째")).toBe("ne beonjjae");
  });

  it("shows 죽다 in its own example and keeps the softer form in the note", () => {
    const die = card("essential_414");
    expect(die.example).toContain("죽었어요");
    expect(die.example).not.toContain("세상을 떠나");
    expect(die.exampleEnglish).toBe("My dog died yesterday.");
    expect(die.usageNote).toContain("세상을 떠나다");
  });
});

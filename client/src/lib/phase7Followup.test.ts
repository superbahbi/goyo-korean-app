import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";
import { romanize } from "./romanize";

const byId = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

function card(id: string) {
  const value = byId.get(id);
  if (!value) throw new Error(`missing ${id}`);
  return value;
}

// Defects found by the Phase 7 re-measurement, recorded in
// docs/audits/essential-sample-3.json and essential-sample-4.json.
describe("Phase 7 content fixes", () => {
  it("gives the tooth card a sentence that makes sense", () => {
    const tooth = card("essential_259");
    expect(tooth.example).toContain("이빨로");
    expect(tooth.example).not.toContain("제 이빨을");
    expect(tooth.exampleEnglish).toContain("teeth");
  });

  it("describes 섬 compounds with the Sino-Korean 도", () => {
    const island = card("essential_307");
    expect(island.usageNote).toContain("도 (島)");
    expect(island.usageNote).not.toMatch(/can be combined \(e\.g\., 무인도/);
  });

  it("tags 밖에 as a place adverb", () => {
    const outside = card("essential_355");
    expect(outside.partOfSpeech).toBe("adverb");
    expect(outside.usageNote).toContain("place adverb");
  });

  it("drops the stale part-of-speech clause from 곧장", () => {
    expect(card("essential_358").usageNote).not.toMatch(/not a noun/i);
  });

  it("uses the standard spaced ordinal for 다섯 번째", () => {
    const fifth = card("essential_374");
    expect(fifth.front).toBe("다섯 번째");
    expect(fifth.romanization).toBe("daseot beonjjae");
    expect(fifth.partOfSpeech).toBe("number");
    expect(fifth.example).toContain("다섯 번째");
    expect(fifth.usageNote).not.toMatch(/two-word form/);
  });

  it("describes 냄새를 맡다 with 냄새 as the object", () => {
    const smell = card("essential_423");
    expect(smell.usageNote).toContain("냄새 is the object");
    expect(smell.usageNote).not.toMatch(/thing smelled as object/);
  });

  it("romanizes 앉다 with Revised Romanization", () => {
    const sit = card("essential_433");
    expect(sit.romanization).toBe("anda");
    expect(romanize("앉다")).toBe("anda");
    expect(romanize("앉아")).toBe("anja");
  });

  it("shows 돌다 in its own example", () => {
    const turn = card("essential_457");
    expect(turn.example).toContain("돌아요");
    expect(turn.example).not.toContain("돌려");
    expect(turn.exampleEnglish).toBe("The Earth goes around the sun.");
  });

  it("keeps accessories out of the 입다 note", () => {
    const wear = card("essential_473");
    expect(wear.usageNote).not.toMatch(/or accessories/);
    expect(wear.usageNote).toContain("끼다");
  });

  it("disambiguates the short gloss", () => {
    expect(card("essential_481").back).toBe("to be short (in height)");
  });
});

import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";

const byId = new Map(ESSENTIAL_WORDS.map(card => [card.id, card]));

function card(id: string) {
  const value = byId.get(id);
  if (!value) throw new Error(`missing ${id}`);
  return value;
}

describe("Phase 7 sweep batch 6 fixes", () => {
  it("translates 기름 as a plain sentence", () => {
    const oil = card("essential_019");
    expect(oil.exampleEnglish).toBe("I need to fill the car with gas.");
  });

  it("wears pants instead of putting them on the feet", () => {
    const pants = card("essential_060");
    expect(pants.example).toBe("오늘은 새 바지를 입고 출근했어요.");
    expect(pants.example).not.toContain("신고 출근");
  });

  it("uses the standard 판결이 났어요 form for 살인", () => {
    const murder = card("essential_139");
    expect(murder.example).toBe("그 사건은 결국 살인으로 판결이 났어요.");
    expect(murder.example).not.toContain("판결났습니다");
  });

  it("tags 안에 as a place adverb like 밖에", () => {
    const inside = card("essential_354");
    expect(inside.partOfSpeech).toBe("adverb");
  });
});

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

// Defects found by the second Phase 7 sweep batch, recorded in
// docs/audits/essential-sample-6.json.
describe("Phase 7 sweep batch 2 fixes", () => {
  it("describes both the animal and food senses of fish", () => {
    const fish = card("essential_003");
    expect(fish.usageNote).toContain("생선");
    expect(fish.usageNote).not.toMatch(/cooked fish/);
  });

  it("uses the possessive particle for the car's tire pressure", () => {
    const tire = card("essential_018");
    expect(tire.example).toBe("차의 타이어 공기압을 확인했어요.");
    expect(tire.exampleEnglish).toBe("I checked the car's tire pressure.");
  });

  it("assimilates ㄹ to n after ㄴ/ㅁ/ㅇ", () => {
    expect(romanize("대통령")).toBe("daetongnyeong");
    expect(romanize("음료수")).toBe("eumnyosu");
    expect(romanize("정력")).toBe("jeongnyeok");
    expect(romanize("종로")).toBe("jongno");
    expect(romanize("심리")).toBe("simni");

    expect(card("essential_096").romanization).toBe("daetongnyeong");
    expect(card("essential_142").romanization).toBe("jeongnyeok");
    expect(card("essential_174").romanization).toBe("eumnyosu");
  });

  it("keeps ㄹ as l after another ㄹ", () => {
    expect(romanize("빨리")).toBe("ppalli");
    expect(romanize("설날")).toBe("seolnal");
  });

  it("wipes what actually got on the lips", () => {
    const lips = card("essential_257");
    expect(lips.example).toBe(
      "그는 초콜릿을 먹다가 입술에 묻은 것을 닦았어요."
    );
    expect(lips.example).not.toContain("묻었는지");
    expect(lips.exampleEnglish).toBe(
      "He wiped off the chocolate that got on his lips while eating."
    );
  });

  it("separates everyday 피 from medical 혈액", () => {
    const blood = card("essential_272");
    expect(blood.usageNote).toContain("혈액");
    expect(blood.usageNote).not.toMatch(/compounds \(혈액\)/);
  });

  it("uses 년 as a year counter, not for age", () => {
    const year = card("essential_395");
    expect(year.example).toBe("한국에 온 지 삼 년이 되었어요.");
    expect(year.example).not.toContain("스물다섯");
    expect(year.exampleEnglish).toBe(
      "It has been three years since I came to Korea."
    );
  });
});

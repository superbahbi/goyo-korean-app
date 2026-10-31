import { describe, it, expect } from "vitest";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";

// Claims removed in the Phase 3 usage-note sweep. Each substring below was
// copied verbatim from a note that made a false or garbled claim.
const BANNED_CLAIMS = [
  "also means 'new' in Sino-Korean",
  "more formal than 옷 or 정장",
  "can be shortened to 노랑",
  "formal/loanword for navy blue",
  "often used with -색 to mean",
  "often used with -의 or -인",
  "not used for girls",
  "for an individual officer formality",
  "for enlisted soldier in informal contexts",
  "polite contexts often use 직장 상사",
  "also means promise/plan",
  "meaning 'zero' or 'public'",
  "Konglish for 'juice'",
  "solid ingredients may be called",
  "창문지",
  "Koreanized term for ballpoint pen",
  "potted plant brand",
  "metaphorical (e.g., 분위기)",
  "figuratively (e.g., 분위기)",
  "literary/archaic variant",
  "as 부/서쪽",
  "formal or literary way to say January",
  "formal/old-fashioned term for February",
  "formal written style",
  "literary/slightly formal tone",
  "formal word but common in dates",
  "native Korean name for the month August",
  "formal/literary word for 'September'",
  "traditional/literary term for October",
  "formal calendar use",
  "'to operate' in technical contexts",
  "time/rumors",
  "generalverb",
  "Polite everyday form",
  "Formal and strong verb",
  "'to sting' or 'to send'",
  "jump a task",
  "맛보다 → 맛보다",
  "주로 사람이나 동물이",
  "can also mean 'to lie down'",
  "commonly used for casual and formal contexts",
  "can mean shove or postpone",
  "part of speech given as noun",
  "commonly used informally about people",
  "차겁다",
  "can follow nouns or verbs",
  "adjectives like 건강하다",
  "metaphorically (e.g., skin, layers)",
  "제 (less formal)",
  "Used as polite 'you'",
];

const FIXED_CARD_IDS = [
  "essential_004",
  "essential_057",
  "essential_069",
  "essential_070",
  "essential_074",
  "essential_075",
  "essential_085",
  "essential_116",
  "essential_118",
  "essential_121",
  "essential_129",
  "essential_154",
  "essential_171",
  "essential_177",
  "essential_209",
  "essential_215",
  "essential_291",
  "essential_292",
  "essential_301",
  "essential_306",
  "essential_362",
  "essential_376",
  "essential_377",
  "essential_379",
  "essential_380",
  "essential_381",
  "essential_383",
  "essential_384",
  "essential_385",
  "essential_387",
  "essential_402",
  "essential_404",
  "essential_407",
  "essential_412",
  "essential_413",
  "essential_420",
  "essential_422",
  "essential_425",
  "essential_439",
  "essential_441",
  "essential_443",
  "essential_468",
  "essential_469",
  "essential_481",
  "essential_488",
  "essential_495",
  "essential_500",
  "essential_512",
  "essential_541",
  "essential_543",
];

describe("imported usage notes", () => {
  it("gives every imported card a non-empty usage note", () => {
    for (const card of ESSENTIAL_WORDS)
      expect(card.usageNote?.trim(), card.id).toBeTruthy();
  });

  it("never repeats a disproven claim removed in the Phase 3 sweep", () => {
    for (const card of ESSENTIAL_WORDS) {
      const note = card.usageNote ?? "";
      for (const claim of BANNED_CLAIMS)
        expect(note, `${card.id} ${card.front}`).not.toContain(claim);
    }
  });

  it("keeps a usage note on every card fixed in the sweep", () => {
    for (const id of FIXED_CARD_IDS) {
      const card = ESSENTIAL_WORDS.find(candidate => candidate.id === id);
      expect(card, id).toBeDefined();
      expect(card?.usageNote?.trim(), id).toBeTruthy();
    }
  });
});

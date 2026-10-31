import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { VOCABULARY_DATA, STUDY_READY_VOCABULARY } from "./vocabulary";
import { ESSENTIAL_WORDS } from "./essentialVocabulary";
import { romanize } from "./romanize";

// Genuine homonyms kept as separate cards: 차 car/tea, 눈 eye/snow, 배 boat-pear/stomach,
// 다리 bridge/leg, 열 ten/fever, 분 minute/honorific person, 공 ball/zero, 병 bottle/illness.
const HOMONYM_FRONTS = ["공", "눈", "다리", "배", "병", "분", "열", "차"].sort();

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const manifest = JSON.parse(readFileSync(path.join(REPO_ROOT, "public/audio/index.json"), "utf8")) as {
  vocabulary: Record<string, string>;
  female: { vocabulary: Record<string, string> };
};

// Revised Romanization writes ll for a geminate ㄹㄹ (얼룩 eolluk), so ll is only an error elsewhere.
function hasGeminateRieul(text: string): boolean {
  const syllableCode = (ch: string) => ch.codePointAt(0)! - 0xac00;
  const isSyllable = (code: number) => code >= 0 && code <= 11171;
  const chars = [...text];
  return chars.some((ch, i) => {
    const first = syllableCode(ch);
    const second = i + 1 < chars.length ? syllableCode(chars[i + 1]) : -1;
    return isSyllable(first) && isSyllable(second) && first % 28 === 8 && Math.floor(second / 588) === 5;
  });
}

describe("combined vocabulary deck", () => {
  it("has no duplicate ids", () => {
    const ids = VOCABULARY_DATA.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every card a non-empty front, back, romanization and tag", () => {
    for (const card of VOCABULARY_DATA) {
      expect(card.front.trim(), card.id).not.toBe("");
      expect(card.back.trim(), card.id).not.toBe("");
      expect(card.romanization.trim(), card.id).not.toBe("");
      expect(card.tag.trim(), card.id).not.toBe("");
    }
  });

  it("has no duplicate fronts except the homonym allowlist", () => {
    const counts = new Map<string, number>();
    for (const card of VOCABULARY_DATA) counts.set(card.front, (counts.get(card.front) ?? 0) + 1);
    const duplicates = [...counts].filter(([, count]) => count > 1).map(([front]) => front).sort();
    expect(duplicates).toEqual(HOMONYM_FRONTS);
  });

  it("finds 집 and 학교 in the curated deck with Revised Romanization", () => {
    const house = VOCABULARY_DATA.find((card) => card.front === "집");
    const school = VOCABULARY_DATA.find((card) => card.front === "학교");
    expect(house?.romanization).toBe("jip");
    expect(school?.romanization).toBe("hakgyo");
  });

  it("gives every study-ready card a male and female audio entry in the manifest", () => {
    for (const card of STUDY_READY_VOCABULARY) {
      const male = manifest.vocabulary[card.id];
      const female = manifest.female.vocabulary[card.id];
      expect(male, `male ${card.id}`).toBe(`elevenlabs_${card.id}.mp3`);
      expect(female, `female ${card.id}`).toBe(`elevenlabs_female_${card.id}.mp3`);
      expect(existsSync(path.join(REPO_ROOT, "public/audio", male)), male).toBe(true);
      expect(existsSync(path.join(REPO_ROOT, "public/audio", female)), female).toBe(true);
    }
  });
});

describe("Revised Romanization", () => {
  it("transliterates known words", () => {
    const cases: [string, string][] = [
      ["집", "jip"],
      ["학교", "hakgyo"],
      ["식당", "sikdang"],
      ["기름", "gireum"],
      ["같이", "gachi"],
      ["먹어요", "meogeoyo"],
      ["무릎", "mureup"],
      ["트럭", "teureok"],
      ["냄새를 맡다", "naemsaereul matda"],
    ];
    for (const [front, expected] of cases) expect(romanize(front), front).toBe(expected);
  });

  it("keeps every imported romanization in line with the transliterator", () => {
    for (const card of ESSENTIAL_WORDS) {
      expect(card.romanization, card.id).toBe(romanize(card.front));
    }
  });

  it("never writes iii", () => {
    for (const card of VOCABULARY_DATA) expect(card.romanization, card.id).not.toMatch(/iii/);
  });

  it("writes ll only for a geminate ㄹㄹ in the Hangul", () => {
    for (const card of VOCABULARY_DATA) {
      if (/ll/.test(card.romanization)) expect(hasGeminateRieul(card.front), card.id).toBe(true);
    }
  });
});

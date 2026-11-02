import { describe, expect, it } from "vitest";
import type { VocabularyCard } from "@/lib/vocabulary";
import { pickDistractors } from "./practiceDistractors";

function card(
  id: string,
  overrides: Partial<VocabularyCard> = {}
): VocabularyCard {
  return {
    id,
    front: id,
    back: `${id} meaning`,
    romanization: id,
    tag: "daily",
    example: "",
    difficulty: "beginner",
    partOfSpeech: "noun",
    ...overrides,
  };
}

const keepOrder = (cards: readonly VocabularyCard[]) => [...cards];

describe("pickDistractors", () => {
  it("follows listening's rules: three options, deduped by meaning", () => {
    const cards = [
      card("current", { back: "Hello" }),
      card("b", { back: "One" }),
      card("c", { back: " one " }),
      card("d", { back: "Two" }),
      card("e", { back: "Three" }),
      card("f", { back: "HELLO" }),
    ];

    const picked = pickDistractors(cards, {
      count: 3,
      correctCardId: "current",
      dedupeKey: candidate => candidate.back.trim().toLowerCase(),
      shuffleCards: keepOrder,
    });

    expect(picked.map(candidate => candidate.id)).toEqual(["b", "d", "e"]);
  });

  it("follows scenario's rules: two options, deduped by phrase, survival first", () => {
    const cards = [
      card("current", { front: "안녕하세요", tag: "survival" }),
      card("daily", { front: "책" }),
      card("survival_1", { front: "감사합니다", tag: "survival" }),
      card("survival_2", { front: "죄송합니다", tag: "survival" }),
      card("duplicate", { front: "책", tag: "survival" }),
    ];

    const picked = pickDistractors(cards, {
      count: 2,
      correctCardId: "current",
      dedupeKey: candidate => candidate.front,
      preferTag: "survival",
      shuffleCards: keepOrder,
    });

    expect(picked.map(candidate => candidate.id)).toEqual([
      "survival_1",
      "survival_2",
    ]);
  });

  it("keeps preferring survival cards without repeating a phrase", () => {
    const cards = [
      card("current", { front: "안녕하세요", tag: "survival" }),
      card("survival", { front: "감사합니다", tag: "survival" }),
      card("daily", { front: "책" }),
      card("duplicate", { front: "감사합니다", tag: "survival" }),
    ];

    const picked = pickDistractors(cards, {
      count: 2,
      correctCardId: "current",
      dedupeKey: candidate => candidate.front,
      preferTag: "survival",
      shuffleCards: keepOrder,
    });

    expect(picked.map(candidate => candidate.id)).toEqual([
      "survival",
      "daily",
    ]);
  });

  it("never includes the correct card, even under another meaning", () => {
    const cards = [
      card("current", { front: "네", back: "Yes" }),
      card("same_meaning", { front: "예", back: "yes " }),
      card("other", { front: "아니요", back: "No" }),
    ];

    const picked = pickDistractors(cards, {
      count: 2,
      correctCardId: "current",
      dedupeKey: candidate => candidate.back.trim().toLowerCase(),
      shuffleCards: keepOrder,
    });

    expect(picked.map(candidate => candidate.id)).toEqual(["other"]);
  });

  it("returns fewer options when there are not enough candidates", () => {
    const cards = [card("current"), card("one"), card("two")];

    const picked = pickDistractors(cards, {
      count: 3,
      correctCardId: "current",
      dedupeKey: candidate => candidate.back,
      shuffleCards: keepOrder,
    });

    expect(picked.map(candidate => candidate.id)).toEqual(["one", "two"]);
  });

  it("returns nothing for an empty deck or a zero count", () => {
    expect(
      pickDistractors([], {
        count: 3,
        correctCardId: "current",
        dedupeKey: candidate => candidate.back,
      })
    ).toEqual([]);
    expect(
      pickDistractors([card("current"), card("one")], {
        count: 0,
        correctCardId: "current",
        dedupeKey: candidate => candidate.back,
      })
    ).toEqual([]);
  });

  it("never repeats a card when the real shuffle runs", () => {
    const cards = ["a", "b", "c", "d", "e"].map(id => card(id));

    const picked = pickDistractors(cards, {
      count: 3,
      correctCardId: "a",
      dedupeKey: candidate => candidate.back,
    });

    expect(picked).toHaveLength(3);
    expect(new Set(picked.map(candidate => candidate.id)).size).toBe(3);
    expect(picked.map(candidate => candidate.id)).not.toContain("a");
  });
});

import { describe, expect, it } from "vitest";
import { createQuestionLoop, type PracticeQuestion } from "./practiceQuestion";
import { describeVerdict, ratingForVerdict } from "./practiceVerdict";

interface TestQuestion extends PracticeQuestion {
  id: string;
}

function questions(): TestQuestion[] {
  return [
    { id: "a", answerId: "a" },
    { id: "b", answerId: "b" },
  ];
}

function setup() {
  return createQuestionLoop<TestQuestion>({ buildRound: questions });
}

describe("practice verdict", () => {
  it("exposes the current question's answer before anything is chosen", () => {
    const verdict = describeVerdict(setup().getState());

    expect(verdict).toMatchObject({
      correctId: "a",
      answered: false,
      isCorrect: false,
      isLast: false,
      rating: "again",
    });
  });

  it("maps a correct choice to good and the answer id", () => {
    const loop = setup();
    loop.answer("a");

    const verdict = describeVerdict(loop.getState());

    expect(verdict).toMatchObject({
      correctId: "a",
      answered: true,
      isCorrect: true,
      rating: "good",
    });
  });

  it("maps a wrong choice to again without trusting the chosen id", () => {
    const loop = setup();
    loop.answer("b");

    expect(describeVerdict(loop.getState())).toMatchObject({
      isCorrect: false,
      rating: "again",
    });
  });

  it("reports the last question independent of whether it was answered", () => {
    const loop = setup();
    loop.answer("a");
    loop.next();

    expect(describeVerdict(loop.getState())).toMatchObject({
      answered: false,
      isLast: true,
    });
  });

  it("has no answer id and is not last for an empty round", () => {
    const loop = createQuestionLoop<TestQuestion>({ buildRound: () => [] });

    expect(describeVerdict(loop.getState())).toMatchObject({
      question: undefined,
      correctId: null,
      isLast: false,
    });
  });

  it("is the one verdict-to-rating rule", () => {
    expect(ratingForVerdict(true)).toBe("good");
    expect(ratingForVerdict(false)).toBe("again");
  });
});

import { describe, expect, it, vi } from "vitest";
import { createQuestionLoop, type PracticeQuestion } from "./practiceQuestion";

interface TestQuestion extends PracticeQuestion {
  id: string;
  choices: string[];
}

function round(version: number): TestQuestion[] {
  return ["a", "b", "c"].map(id => ({
    id,
    answerId: id,
    choices: [`${id}-${version}`, "wrong"],
  }));
}

function setup(questions = round(1)) {
  const buildRound = vi.fn(() => questions);
  const loop = createQuestionLoop({ buildRound });
  return { loop, buildRound };
}

describe("question loop", () => {
  it("starts unanswered on the first question with no score", () => {
    const { loop } = setup();

    expect(loop.getState()).toMatchObject({
      index: 0,
      selectedId: null,
      verdict: "unanswered",
      correctCount: 0,
      completed: false,
    });
    expect(loop.getState().questions).toHaveLength(3);
  });

  it("records a correct answer and adds to the score", () => {
    const { loop } = setup();

    const state = loop.answer("a");

    expect(state).toMatchObject({
      selectedId: "a",
      verdict: "correct",
      correctCount: 1,
      index: 0,
      completed: false,
    });
  });

  it("records an incorrect answer without adding to the score", () => {
    const { loop } = setup();

    const state = loop.answer("wrong");

    expect(state).toMatchObject({
      selectedId: "wrong",
      verdict: "incorrect",
      correctCount: 0,
    });
  });

  it("keeps the first verdict when a second answer arrives", () => {
    const { loop } = setup();

    loop.answer("wrong");
    const state = loop.answer("a");

    expect(state).toMatchObject({
      selectedId: "wrong",
      verdict: "incorrect",
      correctCount: 0,
    });
  });

  it("advances after answering and clears the selection", () => {
    const { loop } = setup();

    loop.answer("a");
    const state = loop.next();

    expect(state).toMatchObject({
      index: 1,
      selectedId: null,
      verdict: "unanswered",
      correctCount: 1,
      completed: false,
    });
  });

  it("does not advance before the current question is answered", () => {
    const { loop } = setup();

    expect(loop.next().index).toBe(0);
    expect(loop.next().verdict).toBe("unanswered");
  });

  it("accumulates the score across the round", () => {
    const { loop } = setup();

    loop.answer("a");
    loop.next();
    loop.answer("wrong");
    loop.next();
    const state = loop.answer("c");

    expect(state.correctCount).toBe(2);
    expect(state.index).toBe(2);
  });

  it("completes after the last question and ignores further commands", () => {
    const { loop } = setup();

    loop.answer("a");
    loop.next();
    loop.answer("wrong");
    loop.next();
    loop.answer("c");
    const completed = loop.next();

    expect(completed).toMatchObject({
      index: 2,
      completed: true,
      correctCount: 2,
    });
    expect(loop.next()).toBe(completed);
    expect(loop.answer("a")).toBe(completed);
  });

  it("restarts the score and index, and rebuilds the round's choices", () => {
    let version = 0;
    const buildRound = vi.fn(() => {
      version += 1;
      return round(version);
    });
    const loop = createQuestionLoop({ buildRound });

    expect(loop.getState().questions[0].choices[0]).toBe("a-1");

    loop.answer("a");
    loop.next();
    loop.answer("wrong");
    loop.next();
    const restarted = loop.restart();

    expect(restarted).toMatchObject({
      index: 0,
      selectedId: null,
      verdict: "unanswered",
      correctCount: 0,
      completed: false,
    });
    // A new round is built, not a reset of the same question objects, so the
    // renderer sees fresh distractors and order.
    expect(restarted.questions[0].choices[0]).toBe("a-2");
    expect(buildRound).toHaveBeenCalledTimes(2);

    expect(loop.answer("a").verdict).toBe("correct");
  });

  it("is complete from the start when the deck is empty", () => {
    const { loop } = setup([]);

    expect(loop.getState()).toMatchObject({
      index: 0,
      completed: true,
      correctCount: 0,
    });
    expect(loop.answer("a")).toBe(loop.getState());
    expect(loop.next()).toBe(loop.getState());
    expect(loop.restart().completed).toBe(true);
  });

  it("notifies subscribers until they unsubscribe", () => {
    const { loop } = setup();
    const listener = vi.fn();
    const unsubscribe = loop.subscribe(listener);

    loop.answer("a");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    loop.next();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

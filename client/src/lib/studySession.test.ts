import { describe, expect, it, vi } from "vitest";
import type { CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";
import {
  MAX_RESPONSE_TIME_MS,
  MIN_RESPONSE_TIME_MS,
  acknowledgeNewCardIntro,
  clampResponseTime,
  createStudySession,
  shouldShowNewCardIntro,
  type StudyRating,
} from "./studySession";

function card(id: string): VocabularyCard {
  return {
    id,
    front: id,
    back: `${id} meaning`,
    romanization: id,
    tag: "survival",
    example: `${id} example`,
    difficulty: "beginner",
    partOfSpeech: "noun",
  };
}

const reviewed: CardState = {
  id: "surv_001",
  due: "2026-11-02",
  interval: 2,
  timesReviewed: 1,
  timesCorrect: 1,
  lastReviewDate: "2026-11-01",
};

interface GradeRecord {
  cardId: string;
  rating: StudyRating;
  responseTimeMs: number;
}

function setup(options: { queue?: VocabularyCard[]; startAt?: number } = {}) {
  let now = options.startAt ?? 0;
  const grades: GradeRecord[] = [];
  const stopAudio = vi.fn();
  const onClose = vi.fn();
  const session = createStudySession({
    queue: options.queue ?? [card("a"), card("b")],
    clock: () => now,
    onGrade: (cardId, rating, gradeOptions) => {
      grades.push({
        cardId,
        rating,
        responseTimeMs: gradeOptions.responseTimeMs,
      });
    },
    stopAudio,
    onClose,
  });

  return {
    session,
    grades,
    stopAudio,
    onClose,
    at(value: number) {
      now = value;
    },
    advance(ms: number) {
      now += ms;
    },
  };
}

describe("response latency", () => {
  it("clamps a response to the scheduler's window", () => {
    expect(clampResponseTime(0)).toBe(MIN_RESPONSE_TIME_MS);
    expect(clampResponseTime(249)).toBe(MIN_RESPONSE_TIME_MS);
    expect(clampResponseTime(2500)).toBe(2500);
    expect(clampResponseTime(MAX_RESPONSE_TIME_MS + 1)).toBe(
      MAX_RESPONSE_TIME_MS
    );
  });

  it("uses the visible card's age when the learner grades without revealing", () => {
    const { session, grades, at } = setup({
      queue: [card("a")],
      startAt: 1000,
    });
    at(1100);

    session.grade("good");

    expect(grades[0].responseTimeMs).toBe(MIN_RESPONSE_TIME_MS);
  });

  it("captures display-to-first-reveal, not display-to-grade", () => {
    const { session, grades, at } = setup({
      queue: [card("a")],
      startAt: 1000,
    });
    at(4000);
    session.setRevealed(true);
    at(9000);

    session.grade("good");

    expect(grades[0].responseTimeMs).toBe(3000);
  });

  it("caps a response that took longer than two minutes", () => {
    const { session, grades, at } = setup({ queue: [card("a")] });
    at(MAX_RESPONSE_TIME_MS + 100000);

    session.grade("good");

    expect(grades[0].responseTimeMs).toBe(MAX_RESPONSE_TIME_MS);
  });

  it("starts the recall clock when the intro is dismissed", () => {
    const { session, grades, at } = setup({ queue: [card("a")] });
    at(500);
    session.dismissIntro();
    at(2000);
    session.setRevealed(true);
    at(5000);

    session.grade("good");

    expect(grades[0].responseTimeMs).toBe(1500);
  });
});

describe("grade lock", () => {
  it("ignores a second grade before the next card paints", () => {
    const { session, grades } = setup();

    session.grade("good");
    session.grade("good");

    expect(grades).toHaveLength(1);
    expect(grades[0]).toMatchObject({ cardId: "a", rating: "good" });
    expect(session.getState()).toMatchObject({
      index: 1,
      gradingLocked: true,
      results: { again: 0, good: 1, easy: 0 },
    });
  });

  it("grades the next card once the lock is released", () => {
    const { session, grades } = setup();

    session.grade("good");
    session.releaseGradeLock();
    session.grade("easy");

    expect(grades).toHaveLength(2);
    expect(grades[1]).toMatchObject({ cardId: "b", rating: "easy" });
    expect(session.getState().completed).toBe(true);
  });
});

describe("again retries", () => {
  it("appends a lapse once, at the end of the session", () => {
    const { session } = setup({ queue: [card("a")] });

    session.grade("again");

    const state = session.getState();
    expect(state.queue.map(item => item.id)).toEqual(["a", "a"]);
    expect(state.index).toBe(1);
    expect(state.retryCount).toBe(1);
    expect(state.completed).toBe(false);
  });

  it("never appends the same card twice", () => {
    const { session, grades } = setup({ queue: [card("a")] });

    session.grade("again");
    session.releaseGradeLock();
    session.grade("again");

    const state = session.getState();
    expect(state.queue.map(item => item.id)).toEqual(["a", "a"]);
    expect(state.retryCount).toBe(1);
    expect(state.completed).toBe(true);
    expect(grades.map(grade => grade.rating)).toEqual(["again", "again"]);
  });

  it("still counts each grade in the summary", () => {
    const { session } = setup({ queue: [card("a")] });

    session.grade("again");
    session.releaseGradeLock();
    session.grade("good");

    expect(session.getState().results).toEqual({
      again: 1,
      good: 1,
      easy: 0,
    });
  });
});

describe("completion", () => {
  it("stops audio and ignores further grades after the last card", () => {
    const { session, grades, stopAudio } = setup({ queue: [card("a")] });

    session.grade("easy");
    session.grade("good");

    const state = session.getState();
    expect(state.completed).toBe(true);
    expect(state.results).toEqual({ again: 0, good: 0, easy: 1 });
    expect(grades).toHaveLength(1);
    expect(stopAudio).toHaveBeenCalledTimes(1);
  });
});

describe("restart", () => {
  it("resets the queue, index, results, retries, intro, and panel", () => {
    const { session } = setup();

    session.dismissIntro();
    session.toggleProduction();
    session.setProductionAttempt("안녕하세요");
    session.markProductionDone();
    session.setRevealed(true);
    session.grade("again");
    session.releaseGradeLock();
    session.grade("good");
    session.releaseGradeLock();
    session.grade("easy");

    expect(session.getState().completed).toBe(true);

    session.restart();

    const state = session.getState();
    expect(state.queue.map(item => item.id)).toEqual(["a", "b"]);
    expect(state.index).toBe(0);
    expect(state.revealed).toBe(false);
    expect(state.completed).toBe(false);
    expect(state.retryCount).toBe(0);
    expect(state.results).toEqual({ again: 0, good: 0, easy: 0 });
    expect(state.introducedIds.size).toBe(0);
    expect(state.production).toEqual({
      open: false,
      attempt: "",
      done: false,
    });
    expect(state.gradingLocked).toBe(false);
  });

  it("replays the original plan, not the retry-grown queue", () => {
    const { session } = setup({ queue: [card("a")] });

    session.grade("again");
    expect(session.getState().queue).toHaveLength(2);

    session.restart();

    expect(session.getState().queue).toHaveLength(1);
  });

  it("accepts a grade immediately after restarting", () => {
    const { session, grades } = setup({ queue: [card("a")] });

    session.grade("good");
    session.restart();
    session.grade("easy");

    expect(grades.map(grade => grade.rating)).toEqual(["good", "easy"]);
    expect(session.getState().results.easy).toBe(1);
  });
});

describe("new card introduction", () => {
  it("appears only for cards with no saved state", () => {
    expect(shouldShowNewCardIntro("surv_001", {}, new Set())).toBe(true);
    expect(shouldShowNewCardIntro("surv_001", undefined, new Set())).toBe(true);
    expect(
      shouldShowNewCardIntro("surv_001", { surv_001: reviewed }, new Set())
    ).toBe(false);
  });

  it("does not repeat for a word already introduced, such as an again retry", () => {
    const introduced = acknowledgeNewCardIntro(new Set(), "surv_001");
    expect(shouldShowNewCardIntro("surv_001", {}, introduced)).toBe(false);
    expect(shouldShowNewCardIntro("surv_002", {}, introduced)).toBe(true);
  });

  it("advancing the intro creates no card state", () => {
    const cardStates: Record<string, CardState> = {};

    // The only transition the intro owns is marking the word as seen. It has no
    // grade callback, so nothing can reach onGrade or the saved progress.
    const introduced = acknowledgeNewCardIntro(new Set(), "surv_001");

    expect(introduced.has("surv_001")).toBe(true);
    expect(cardStates).toEqual({});
    expect(shouldShowNewCardIntro("surv_001", cardStates, introduced)).toBe(
      false
    );
  });

  it("is dismissed for the rest of the session, including a retry", () => {
    const cardStates: Record<string, CardState> = {};
    const { session } = setup({ queue: [card("a")] });

    expect(
      shouldShowNewCardIntro("a", cardStates, session.getState().introducedIds)
    ).toBe(true);

    session.dismissIntro();
    session.dismissIntro();

    expect(
      shouldShowNewCardIntro("a", cardStates, session.getState().introducedIds)
    ).toBe(false);
    expect(session.getState().introducedIds.size).toBe(1);

    session.grade("again");

    expect(
      shouldShowNewCardIntro("a", cardStates, session.getState().introducedIds)
    ).toBe(false);
  });
});

describe("production panel", () => {
  it("keeps attempt state per card", () => {
    const { session } = setup();

    session.toggleProduction();
    session.setProductionAttempt("안녕하세요");
    session.markProductionDone();

    expect(session.getState().production).toEqual({
      open: true,
      attempt: "안녕하세요",
      done: true,
    });

    // Revealing and hiding the answer is not a card change.
    session.setRevealed(true);
    session.setRevealed(false);
    expect(session.getState().production.open).toBe(true);

    session.grade("good");

    expect(session.getState().production).toEqual({
      open: false,
      attempt: "",
      done: false,
    });
  });
});

describe("session lifecycle", () => {
  it("notifies subscribers until they unsubscribe", () => {
    const { session } = setup();
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);

    session.setRevealed(true);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    session.setRevealed(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops audio when closing or disposing", () => {
    const closing = setup();
    closing.session.close();
    expect(closing.stopAudio).toHaveBeenCalledTimes(1);
    expect(closing.onClose).toHaveBeenCalledTimes(1);

    const disposing = setup();
    disposing.session.dispose();
    expect(disposing.stopAudio).toHaveBeenCalledTimes(1);
  });
});

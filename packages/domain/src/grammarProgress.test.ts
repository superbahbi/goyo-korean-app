import { describe, expect, it } from "vitest";
import {
  emptyGrammarProgress,
  recordGrammarAttempt,
  sanitizeGrammarProgress,
} from "./grammarProgress";

describe("grammar progress", () => {
  it("starts empty", () => {
    expect(emptyGrammarProgress()).toEqual({
      completedLessonIds: [],
      scores: {},
    });
    expect(sanitizeGrammarProgress("nonsense")).toEqual(emptyGrammarProgress());
  });

  it("records a finished lesson and its score", () => {
    const next = recordGrammarAttempt(emptyGrammarProgress(), "copula", 2, 2);
    expect(next.completedLessonIds).toEqual(["copula"]);
    expect(next.scores.copula).toEqual({ correct: 2, total: 2 });
    expect(next.lastLessonId).toBe("copula");
  });

  it("keeps completion and the best score on a retake", () => {
    const first = recordGrammarAttempt(emptyGrammarProgress(), "past", 1, 2);
    const better = recordGrammarAttempt(first, "past", 2, 2);
    const worse = recordGrammarAttempt(better, "past", 0, 2);

    expect(better.scores.past).toEqual({ correct: 2, total: 2 });
    expect(worse.scores.past).toEqual({ correct: 2, total: 2 });
    expect(worse.completedLessonIds).toEqual(["past"]);
  });

  it("clamps an impossible result", () => {
    const next = recordGrammarAttempt(emptyGrammarProgress(), "but", 9, 2);
    expect(next.scores.but).toEqual({ correct: 2, total: 2 });
    const negative = recordGrammarAttempt(emptyGrammarProgress(), "but", -3, 2);
    expect(negative.scores.but).toEqual({ correct: 0, total: 2 });
  });

  it("discards malformed saved progress", () => {
    const sanitized = sanitizeGrammarProgress({
      completedLessonIds: ["copula", "copula", 7, ""],
      scores: {
        copula: { correct: 2, total: 2 },
        broken: { correct: 3, total: 2 },
        fractional: { correct: 1.5, total: 2 },
        okay: { correct: 1, total: 2 },
      },
      lastLessonId: "copula",
    });

    expect(sanitized.completedLessonIds).toEqual(["copula"]);
    expect(sanitized.scores).toEqual({
      copula: { correct: 2, total: 2 },
      okay: { correct: 1, total: 2 },
    });
    expect(sanitized.lastLessonId).toBe("copula");
  });
});

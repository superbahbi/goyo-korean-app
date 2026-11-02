import type {
  PracticeQuestion,
  QuestionLoopState,
} from "@/lib/practiceQuestion";

/**
 * The verdict a practice renderer needs: which choice was right, whether the
 * learner got it, whether this is the last question, and the grade rating that
 * verdict maps to.
 *
 * The question loop already knows the answer id; renderers must not compare a
 * choice against the card or option index a second time.
 */
export interface PracticeVerdict<TQuestion extends PracticeQuestion> {
  question: TQuestion | undefined;
  /** The id of the choice that answers the current question. */
  correctId: string | null;
  answered: boolean;
  isCorrect: boolean;
  isLast: boolean;
  /** The rating this verdict contributes to the card's schedule. */
  rating: PracticeRating;
}

export type PracticeRating = "again" | "good";

/** Correct answers are a good recall; wrong answers are a lapse. */
export function ratingForVerdict(correct: boolean): PracticeRating {
  return correct ? "good" : "again";
}

export function describeVerdict<TQuestion extends PracticeQuestion>(
  state: QuestionLoopState<TQuestion>
): PracticeVerdict<TQuestion> {
  const question = state.questions[state.index];
  const isCorrect = state.verdict === "correct";
  return {
    question,
    correctId: question?.answerId ?? null,
    answered: state.verdict !== "unanswered",
    isCorrect,
    isLast:
      state.questions.length > 0 && state.index === state.questions.length - 1,
    rating: ratingForVerdict(isCorrect),
  };
}

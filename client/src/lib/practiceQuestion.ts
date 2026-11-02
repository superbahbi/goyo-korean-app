/**
 * Practice question loop: the flow behind every prompt-and-choices mode.
 *
 * This module is the implementation; `useQuestionLoop` is the React adapter.
 * Listening, scenario, and grammar practice all ask one question at a time,
 * record one choice, score it, and advance, so they share this machine instead
 * of re-deriving the same fields in each component.
 *
 * A round is built as a whole. `buildRound` is called once for the first round
 * and again on restart, which is what gives a restarted round fresh distractors
 * and ordering without a counter whose only job is to defeat memoization.
 */

export type QuestionVerdict = "unanswered" | "correct" | "incorrect";

/** The one thing the loop needs to know about a question: its answer. */
export interface PracticeQuestion {
  /** The id of the choice that answers this question. */
  answerId: string;
}

/** Everything a prompt renderer needs from one practice question loop. */
export interface QuestionLoopState<TQuestion extends PracticeQuestion> {
  /** The questions for this round, in prompt order. */
  questions: readonly TQuestion[];
  /** Zero-based position of the current question. */
  index: number;
  /** The choice the learner picked, or null before they answer. */
  selectedId: string | null;
  verdict: QuestionVerdict;
  correctCount: number;
  completed: boolean;
}

export interface QuestionLoopConfig<TQuestion extends PracticeQuestion> {
  /**
   * Build one round's questions and choices. Called on creation and on every
   * restart, so a new round never reuses the previous round's choice order.
   */
  buildRound: () => readonly TQuestion[];
}

/**
 * The loop's command interface. Callers read state through `getState` (or the
 * React adapter) and change it only through `answer`, `next`, and `restart`;
 * the fields that move together cannot be set independently.
 */
export interface QuestionLoop<TQuestion extends PracticeQuestion> {
  getState(): QuestionLoopState<TQuestion>;
  subscribe(listener: () => void): () => void;
  /** Record a choice for the current question; ignored once answered. */
  answer(choiceId: string): QuestionLoopState<TQuestion>;
  /** Advance after an answer, completing the loop after the last question. */
  next(): QuestionLoopState<TQuestion>;
  /** Start a fresh round from `buildRound`. */
  restart(): QuestionLoopState<TQuestion>;
}

function createRoundState<TQuestion extends PracticeQuestion>(
  questions: readonly TQuestion[]
): QuestionLoopState<TQuestion> {
  return {
    questions,
    index: 0,
    selectedId: null,
    verdict: "unanswered",
    correctCount: 0,
    // An empty deck has nothing to ask, so it is complete before it starts.
    completed: questions.length === 0,
  };
}

export function createQuestionLoop<TQuestion extends PracticeQuestion>({
  buildRound,
}: QuestionLoopConfig<TQuestion>): QuestionLoop<TQuestion> {
  let state = createRoundState(buildRound());
  const listeners = new Set<() => void>();

  const setState = (next: QuestionLoopState<TQuestion>) => {
    state = next;
    listeners.forEach(listener => listener());
    return state;
  };

  const answer = (choiceId: string) => {
    const question = state.questions[state.index];
    if (!question || state.completed || state.verdict !== "unanswered") {
      return state;
    }

    const verdict: QuestionVerdict =
      choiceId === question.answerId ? "correct" : "incorrect";
    return setState({
      ...state,
      selectedId: choiceId,
      verdict,
      correctCount: state.correctCount + (verdict === "correct" ? 1 : 0),
    });
  };

  const next = () => {
    // Advancing before answering would skip a question, and advancing after
    // the summary would change a finished result.
    if (state.completed || state.verdict === "unanswered") return state;

    if (state.index + 1 < state.questions.length) {
      return setState({
        ...state,
        index: state.index + 1,
        selectedId: null,
        verdict: "unanswered",
      });
    }

    return setState({ ...state, completed: true });
  };

  const restart = () => setState(createRoundState(buildRound()));

  return {
    getState: () => state,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    answer,
    next,
    restart,
  };
}

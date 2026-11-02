import { useState, useSyncExternalStore } from "react";
import {
  createQuestionLoop,
  type PracticeQuestion,
} from "@/lib/practiceQuestion";

/**
 * The React adapter for the question loop. It owns the subscription and the
 * current question; the machine owns every transition and all score state.
 */
export function useQuestionLoop<TQuestion extends PracticeQuestion>(
  buildRound: () => readonly TQuestion[]
) {
  const [loop] = useState(() => createQuestionLoop({ buildRound }));
  const state = useSyncExternalStore(loop.subscribe, loop.getState);

  return {
    state,
    current: state.questions[state.index],
    answer: loop.answer,
    next: loop.next,
    restart: loop.restart,
  };
}

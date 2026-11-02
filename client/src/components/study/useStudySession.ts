import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { stopAudio } from "@/lib/audioPlayer";
import type { CardState } from "@/lib/mastery";
import { createStudySession, type StudyRating } from "@/lib/studySession";
import { studyKeyCommand } from "@/lib/studyKeys";
import type { VocabularyCard } from "@/lib/vocabulary";

interface UseStudySessionOptions {
  queue: VocabularyCard[];
  /** Saved card states; a card missing here has never been reviewed. */
  cardStates?: Record<string, CardState>;
  onGrade: (
    cardId: string,
    rating: StudyRating,
    options?: { responseTimeMs?: number }
  ) => void;
  onClose: () => void;
}

/**
 * The React adapter for the study session machine. It owns subscription, the
 * clock, audio stop, keyboard wiring, and nothing that decides session flow.
 */
export function useStudySession({
  queue,
  cardStates,
  onGrade,
  onClose,
}: UseStudySessionOptions) {
  // The parent may re-create these callbacks every render; the machine is
  // created once, so it reads the latest ones through refs.
  const onGradeRef = useRef(onGrade);
  const onCloseRef = useRef(onClose);
  onGradeRef.current = onGrade;
  onCloseRef.current = onClose;
  // The machine is created once; this ref lets its phase predicate see the
  // latest saved card states without rebuilding the session.
  const cardStatesRef = useRef(cardStates);
  cardStatesRef.current = cardStates;

  const [session] = useState(() =>
    createStudySession({
      queue,
      clock: () => Date.now(),
      isNewCard: cardId => !cardStatesRef.current?.[cardId],
      onGrade: (cardId, rating, options) =>
        onGradeRef.current(cardId, rating, options),
      stopAudio,
      onClose: () => onCloseRef.current(),
    })
  );

  const state = useSyncExternalStore(session.subscribe, session.getState);
  const currentCard = state.queue[state.index];
  const showIntro = state.phase === "intro";

  // A new card unlocks grading. Doing this in an effect rather than inside the
  // grade handler keeps the second click of a double click locked out until the
  // next card has actually rendered.
  useEffect(() => {
    session.cardShown();
  }, [session, state.index]);

  // Stop any lingering pronunciation when the session unmounts.
  useEffect(() => () => session.dispose(), [session]);

  const phase = state.phase;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // One listener for the session's life. The phase ref keeps it seeing the
  // current card without re-registering on every render.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;

      const command = studyKeyCommand(event, phaseRef.current);
      if (!command) return;

      // New word intro: the replay speaker keeps its native keyboard
      // activation, so Space or Enter on it must not also start the card.
      if (command === "start-intro" && target?.closest("[data-intro-audio]")) {
        return;
      }

      event.preventDefault();
      switch (command) {
        case "close":
          session.close();
          break;
        case "start-intro":
          session.dismissIntro();
          break;
        case "reveal":
          session.setRevealed(true);
          break;
        case "grade-again":
          session.grade("again");
          break;
        case "grade-good":
          session.grade("good");
          break;
        case "grade-easy":
          session.grade("easy");
          break;
        case "consume":
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session]);

  return {
    index: state.index,
    sessionQueue: state.queue,
    currentCard,
    showIntro,
    flipped: state.revealed,
    completed: state.completed,
    results: state.results,
    retryCount: state.retryCount,
    productionOpen: state.production.open,
    productionAttempt: state.production.attempt,
    productionDone: state.production.done,
    dismissIntro: session.dismissIntro,
    handleFlip: session.setRevealed,
    handleGrade: session.grade,
    restartSession: session.restart,
    closeSession: session.close,
    toggleProduction: session.toggleProduction,
    setProductionAttempt: session.setProductionAttempt,
    markProductionDone: session.markProductionDone,
  };
}

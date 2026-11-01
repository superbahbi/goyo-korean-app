import { useEffect, useRef, useState } from "react";
import { VocabularyCard } from "@/lib/vocabulary";
import { stopAudio } from "@/lib/audioPlayer";

export type StudyRating = "again" | "good" | "easy";
export type StudyResults = Record<StudyRating, number>;

interface UseStudySessionOptions {
  queue: VocabularyCard[];
  onGrade: (
    cardId: string,
    rating: StudyRating,
    options?: { responseTimeMs?: number }
  ) => void;
  onClose: () => void;
}

export function useStudySession({
  queue,
  onGrade,
  onClose,
}: UseStudySessionOptions) {
  const [index, setIndex] = useState(0);
  // A failed card re-enters the session once, so the queue can grow while the
  // session runs. Keep it local to avoid replaying the parent's original plan.
  const [sessionQueue, setSessionQueue] = useState<VocabularyCard[]>(() => [
    ...queue,
  ]);
  const retriedIds = useRef(new Set<string>());
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<StudyResults>({
    again: 0,
    good: 0,
    easy: 0,
  });
  const [productionAttempt, setProductionAttempt] = useState("");
  const [productionDone, setProductionDone] = useState(false);
  const cardStartedAt = useRef(Date.now());
  // Recall latency: card display to first reveal, excluding time spent on the back.
  const recallTimeMs = useRef<number | null>(null);
  // Guards against a double click grading the same card twice. The lock is
  // released only once the next card is on screen (or the session restarts).
  const gradingLocked = useRef(false);

  // Stop any lingering pronunciation when the session unmounts.
  useEffect(() => () => stopAudio(), []);

  // A new card unlocks grading; releasing it inside the click handler would let
  // the second click of a double click through before React re-renders.
  useEffect(() => {
    gradingLocked.current = false;
  }, [index]);

  const closeSession = () => {
    stopAudio();
    onClose();
  };

  const currentCard = sessionQueue[index];

  const handleFlip = (nextFlipped: boolean) => {
    if (nextFlipped && recallTimeMs.current === null) {
      recallTimeMs.current = Date.now() - cardStartedAt.current;
    }
    setFlipped(nextFlipped);
  };

  const handleGrade = (rating: StudyRating) => {
    if (gradingLocked.current) return;
    gradingLocked.current = true;

    const responseTimeMs = Math.min(
      120000,
      Math.max(250, recallTimeMs.current ?? Date.now() - cardStartedAt.current)
    );
    onGrade(currentCard.id, rating, { responseTimeMs });
    setResults(current => ({ ...current, [rating]: current[rating] + 1 }));

    // A lapse comes back once, at the end, before the summary. The scheduler
    // already recorded the failure, so the re-grade changes no schedule.
    const shouldRetry =
      rating === "again" && !retriedIds.current.has(currentCard.id);
    if (shouldRetry) {
      retriedIds.current.add(currentCard.id);
      setSessionQueue(current => [...current, currentCard]);
    }

    const nextLength = sessionQueue.length + (shouldRetry ? 1 : 0);
    if (index + 1 < nextLength) {
      setIndex(index + 1);
      setFlipped(false);
      setProductionAttempt("");
      setProductionDone(false);
      cardStartedAt.current = Date.now();
      recallTimeMs.current = null;
    } else {
      // The summary replaces the card immediately, so the last pronunciation
      // must not keep playing behind it.
      stopAudio();
      setCompleted(true);
    }
  };

  const restartSession = () => {
    gradingLocked.current = false;
    retriedIds.current.clear();
    setSessionQueue([...queue]);
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
    setResults({ again: 0, good: 0, easy: 0 });
    setProductionAttempt("");
    setProductionDone(false);
    cardStartedAt.current = Date.now();
    recallTimeMs.current = null;
  };

  // Keyboard study: Space reveals, 1/2/3 grade, Escape closes. The listener is
  // refreshed every render so it always sees the current card and reveal state.
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

      if (event.key === "Escape") {
        event.preventDefault();
        closeSession();
        return;
      }
      if (completed) return;

      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        if (!flipped) handleFlip(true);
        return;
      }
      if (!flipped) return;

      if (event.key === "1") {
        event.preventDefault();
        handleGrade("again");
      } else if (event.key === "2") {
        event.preventDefault();
        handleGrade("good");
      } else if (event.key === "3") {
        event.preventDefault();
        handleGrade("easy");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return {
    index,
    sessionQueue,
    currentCard,
    flipped,
    completed,
    results,
    retryCount: retriedIds.current.size,
    productionAttempt,
    setProductionAttempt,
    productionDone,
    setProductionDone,
    handleFlip,
    handleGrade,
    restartSession,
    closeSession,
  };
}

import type { CardState } from "@/lib/mastery";
import type { StudyPhase } from "@/lib/studyKeys";
import type { VocabularyCard } from "@/lib/vocabulary";

export type StudyRating = "again" | "good" | "easy";
export type StudyResults = Record<StudyRating, number>;

/** Recall latency is clamped to this window before it reaches the scheduler. */
export const MIN_RESPONSE_TIME_MS = 250;
export const MAX_RESPONSE_TIME_MS = 120000;

export const EMPTY_RESULTS: StudyResults = { again: 0, good: 0, easy: 0 };

export function clampResponseTime(ms: number): number {
  return Math.min(MAX_RESPONSE_TIME_MS, Math.max(MIN_RESPONSE_TIME_MS, ms));
}

/**
 * A first meeting is presented before it is tested. Only a card with no saved
 * state is new; once the intro is acknowledged the same card shows its recall
 * card for the rest of the session, including an `again` retry.
 */
export function shouldShowNewCardIntro(
  cardId: string,
  cardStates: Record<string, CardState> | undefined,
  introducedIds: ReadonlySet<string>
): boolean {
  return !cardStates?.[cardId] && !introducedIds.has(cardId);
}

/** Acknowledge the introduction without touching card state or the schedule. */
export function acknowledgeNewCardIntro(
  introducedIds: ReadonlySet<string>,
  cardId: string
): ReadonlySet<string> {
  if (introducedIds.has(cardId)) return introducedIds;
  return new Set<string>(Array.from(introducedIds).concat(cardId));
}

/** The optional "say it in a new sentence" panel for the current card. */
export interface StudyProductionState {
  open: boolean;
  attempt: string;
  done: boolean;
}

const COLLAPSED_PRODUCTION: StudyProductionState = {
  open: false,
  attempt: "",
  done: false,
};

/** Everything the view needs from one study session. */
export interface StudySessionState {
  /** The plan for this session; grows when a lapse re-enters once. */
  queue: readonly VocabularyCard[];
  index: number;
  revealed: boolean;
  completed: boolean;
  results: StudyResults;
  /** Distinct cards that came back once this session. */
  retryCount: number;
  /** Cards introduced during this session. */
  introducedIds: ReadonlySet<string>;
  production: StudyProductionState;
  /** True from a grade until the next card has painted. */
  gradingLocked: boolean;
  /** What the current card is showing: intro, recall, revealed, or summary. */
  phase: StudyPhase;
  /** Clock reading when the current card became the prompt. */
  cardStartedAt: number;
  /** Display-to-first-reveal latency; null until the card is revealed. */
  recallTimeMs: number | null;
}

export interface StudySessionDependencies {
  /** Injected so latency can be tested without waiting on a wall clock. */
  clock: () => number;
  onGrade: (
    cardId: string,
    rating: StudyRating,
    options: { responseTimeMs: number }
  ) => void;
  /** The last card is giving way to the summary. */
  stopAudio: () => void;
  onClose: () => void;
}

export interface StudySessionConfig extends StudySessionDependencies {
  queue: readonly VocabularyCard[];
  /**
   * Whether a card has no saved state yet. The machine uses this, plus the cards
   * already introduced this session, to derive the intro phase.
   */
  isNewCard: (cardId: string) => boolean;
}

/**
 * Study session: the flow of one run through a queue of cards. This module is
 * the implementation; `useStudySession` is the React adapter. The clock,
 * grading sink, audio stop, and close arrive through the interface, so tests
 * drive the machine without a DOM or a real timer.
 *
 * The queue, index, grade lock, latency capture, retry growth, production panel,
 * and restart all change together when a card is graded. Keeping them in one
 * machine means a caller cannot advance the card without also releasing the
 * reveal and clearing the panel.
 */
export interface StudySession {
  getState(): StudySessionState;
  subscribe(listener: () => void): () => void;
  /** Acknowledge the current card's introduction; starts its recall clock. */
  dismissIntro(): void;
  setRevealed(revealed: boolean): void;
  grade(rating: StudyRating): void;
  /**
   * The next card has painted. This is the only command that releases the grade
   * lock, so a double click cannot grade the same card twice.
   */
  cardShown(): void;
  restart(): void;
  setProductionAttempt(value: string): void;
  markProductionDone(): void;
  toggleProduction(): void;
  close(): void;
  dispose(): void;
}

export function createStudySession({
  queue,
  clock,
  isNewCard,
  onGrade,
  stopAudio,
  onClose,
}: StudySessionConfig): StudySession {
  // Restart replays the session's original plan, not the retry-grown queue.
  const initialQueue = [...queue];
  let state: StudySessionState = {
    queue: initialQueue,
    index: 0,
    revealed: false,
    completed: false,
    results: EMPTY_RESULTS,
    retryCount: 0,
    introducedIds: new Set(),
    production: COLLAPSED_PRODUCTION,
    gradingLocked: false,
    phase: "recall",
    cardStartedAt: clock(),
    recallTimeMs: null,
  };

  // Cards that already used their one retry. Only the count is public state.
  let retriedIds = new Set<string>();

  const listeners = new Set<() => void>();

  /** The view phase is derived here, from the same state the view renders. */
  const derivePhase = (next: StudySessionState): StudyPhase => {
    if (next.completed) return "completed";
    const card = next.queue[next.index];
    if (card && !next.introducedIds.has(card.id) && isNewCard(card.id)) {
      return "intro";
    }
    return next.revealed ? "revealed" : "recall";
  };

  const setState = (next: StudySessionState) => {
    state = { ...next, phase: derivePhase(next) };
    listeners.forEach(listener => listener());
  };

  state = { ...state, phase: derivePhase(state) };

  const dismissIntro = () => {
    const card = state.queue[state.index];
    if (!card) return;
    setState({
      ...state,
      introducedIds: acknowledgeNewCardIntro(state.introducedIds, card.id),
      cardStartedAt: clock(),
      recallTimeMs: null,
    });
  };

  const setRevealed = (revealed: boolean) => {
    if (state.revealed === revealed) return;
    setState({
      ...state,
      revealed,
      // Recall latency: card display to first reveal, excluding time spent on
      // the back. A later unflip keeps the captured value.
      recallTimeMs:
        revealed && state.recallTimeMs === null
          ? clock() - state.cardStartedAt
          : state.recallTimeMs,
    });
  };

  const grade = (rating: StudyRating) => {
    const card = state.queue[state.index];
    if (!card || state.completed || state.gradingLocked) return;

    const now = clock();
    const responseTimeMs = clampResponseTime(
      state.recallTimeMs ?? now - state.cardStartedAt
    );

    // Lock before the grade reaches the parent: a second click that lands in
    // the same tick must not grade this card twice.
    state = { ...state, gradingLocked: true };
    onGrade(card.id, rating, { responseTimeMs });

    const results = { ...state.results, [rating]: state.results[rating] + 1 };

    // A lapse comes back once, at the end, before the summary. The scheduler
    // already recorded the failure, so the re-grade changes no schedule.
    const retrying = rating === "again" && !retriedIds.has(card.id);
    if (retrying) retriedIds.add(card.id);
    const nextQueue = retrying ? [...state.queue, card] : state.queue;

    if (state.index + 1 < nextQueue.length) {
      setState({
        ...state,
        queue: nextQueue,
        results,
        retryCount: retriedIds.size,
        index: state.index + 1,
        revealed: false,
        production: COLLAPSED_PRODUCTION,
        cardStartedAt: now,
        recallTimeMs: null,
      });
      return;
    }

    // The summary replaces the card immediately, so the last pronunciation
    // must not keep playing behind it.
    stopAudio();
    setState({
      ...state,
      queue: nextQueue,
      results,
      retryCount: retriedIds.size,
      completed: true,
    });
  };

  // Releasing inside the grade handler would let the second click of a double
  // click through before the next card renders, so the adapter calls this after
  // the next card has painted.
  const cardShown = () => {
    if (!state.gradingLocked) return;
    setState({ ...state, gradingLocked: false });
  };

  const restart = () => {
    retriedIds = new Set();
    setState({
      queue: [...initialQueue],
      index: 0,
      revealed: false,
      completed: false,
      results: EMPTY_RESULTS,
      retryCount: 0,
      introducedIds: new Set(),
      production: COLLAPSED_PRODUCTION,
      gradingLocked: false,
      phase: "recall",
      cardStartedAt: clock(),
      recallTimeMs: null,
    });
  };

  const setProductionAttempt = (value: string) => {
    setState({
      ...state,
      production: { ...state.production, attempt: value },
    });
  };

  const markProductionDone = () => {
    setState({
      ...state,
      production: { ...state.production, done: true },
    });
  };

  const toggleProduction = () => {
    setState({
      ...state,
      production: { ...state.production, open: !state.production.open },
    });
  };

  const close = () => {
    stopAudio();
    onClose();
  };

  const dispose = () => {
    stopAudio();
  };

  return {
    getState: () => state,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dismissIntro,
    setRevealed,
    grade,
    cardShown,
    restart,
    setProductionAttempt,
    markProductionDone,
    toggleProduction,
    close,
    dispose,
  };
}

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Mic2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { useSentenceAudioIds } from "@/hooks/useSentenceAudioIds";
import { ProductionAttempt } from "./study/ProductionAttempt";
import { GradeActions } from "./study/GradeActions";
import { StudySessionSummary } from "./study/StudySessionSummary";
import { NewCardIntro } from "./study/NewCardIntro";
import { useStudySession } from "./study/useStudySession";
import { PracticeShell } from "./practice/PracticeShell";
import { VocabularyCard } from "@/lib/vocabulary";
import { previewIntervals } from "@/lib/srs";
import { cn } from "@/lib/utils";
import type { CardState } from "@/lib/mastery";

interface StudySessionProps {
  queue: VocabularyCard[];
  /** Saved card states; used to teach cards the learner has never seen. */
  cardStates?: Record<string, CardState>;
  onGrade: (
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: { responseTimeMs?: number }
  ) => void;
  onClose: () => void;
  allowRepeat?: boolean;
  autoPlayAudio?: boolean;
  title?: string;
}

export function StudySession({
  queue,
  cardStates,
  onGrade,
  onClose,
  allowRepeat = false,
  autoPlayAudio = true,
  title = "Daily Session",
}: StudySessionProps) {
  const study = useStudySession({ queue, cardStates, onGrade, onClose });
  const sentenceAudioIds = useSentenceAudioIds();
  const {
    index,
    sessionQueue,
    currentCard,
    showIntro,
    flipped,
    completed,
    results,
    retryCount,
    productionAttempt,
    setProductionAttempt,
    productionDone,
    setProductionDone,
    dismissIntro,
    handleFlip,
    handleGrade,
    restartSession,
    closeSession,
  } = study;

  // The optional production box is collapsed by default: on a phone it used to
  // take more space than the card itself. Tracking the card the panel was
  // opened for collapses it again on the next card without an effect.
  const [productionOpenFor, setProductionOpenFor] = useState<number | null>(
    null
  );
  const showProduction = productionOpenFor === index;

  // Preview against the card's saved schedule. Renders after a grade use the
  // state the parent just persisted, so the labels match what was saved.
  const intervals = useMemo(
    () =>
      previewIntervals(
        flipped ? cardStates?.[currentCard?.id ?? ""] : undefined
      ),
    [flipped, currentCard?.id, cardStates]
  );

  if (completed) {
    return (
      <StudySessionSummary
        results={results}
        failedCards={retryCount}
        allowRepeat={allowRepeat}
        onClose={closeSession}
        onRestart={restartSession}
      />
    );
  }

  if (!currentCard) return null;

  // Teach a never-reviewed word before testing it. This branch never grades,
  // so grades, XP and the schedule still begin on the recall card.
  if (showIntro) {
    return (
      <PracticeShell
        title={title}
        showTitle={false}
        tone="emerald"
        closeLabel="Close study session"
        onClose={closeSession}
        progress={(index / sessionQueue.length) * 100}
        progressLabel="Session progress"
        counter={`${index + 1} / ${sessionQueue.length}`}
        center
      >
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          New word. Press Enter or Space to start practising.
        </p>
        <NewCardIntro
          card={currentCard}
          autoPlayAudio={autoPlayAudio}
          sentenceAudioReady={sentenceAudioIds.has(currentCard.id)}
          onStart={dismissIntro}
        />
      </PracticeShell>
    );
  }

  return (
    <PracticeShell
      title={title}
      showTitle={false}
      tone="emerald"
      closeLabel="Close study session"
      onClose={closeSession}
      progress={((index + (flipped ? 0.5 : 0)) / sessionQueue.length) * 100}
      progressLabel="Session progress"
      counter={`${index + 1} / ${sessionQueue.length}`}
      status={`${title} · ${flipped ? "Choose a rating" : "Recall first"}`}
      footer={
        !flipped ? (
          <Button
            className="h-14 w-full rounded-2xl bg-slate-900 text-lg font-bold text-white transition-all hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 sm:h-16 sm:text-xl"
            onClick={() => handleFlip(true)}
          >
            Reveal Korean &amp; Meaning
          </Button>
        ) : (
          <div>
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How did that feel?
            </p>
            <GradeActions intervals={intervals} onGrade={handleGrade} />
            <button
              type="button"
              aria-expanded={showProduction}
              aria-controls="production-attempt"
              onClick={() =>
                setProductionOpenFor(current =>
                  current === index ? null : index
                )
              }
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            >
              <Mic2 size={14} aria-hidden="true" />
              Say it in a new sentence
              {productionDone && (
                <span className="flex items-center gap-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                  <Check size={12} aria-hidden="true" />
                  Tried
                </span>
              )}
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cn(
                  "transition-transform",
                  showProduction && "rotate-180"
                )}
              />
            </button>
            <div id="production-attempt" hidden={!showProduction}>
              <ProductionAttempt
                value={productionAttempt}
                onChange={setProductionAttempt}
                done={productionDone}
                onDone={() => setProductionDone(true)}
              />
            </div>
          </div>
        )
      }
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {flipped
          ? "Answer revealed. Press 1 for Again, 2 for Good, or 3 for Easy."
          : `Card ${index + 1} of ${sessionQueue.length}. Press Space to reveal.`}
      </p>

      <div
        tabIndex={0}
        aria-label="Study card"
        className="flex-1 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
      >
        <AnimatePresence mode="wait">
          <FlashCard
            key={currentCard.id}
            wordId={currentCard.id}
            front={currentCard.front}
            back={currentCard.back}
            romanization={currentCard.romanization}
            example={currentCard.example}
            exampleEnglish={currentCard.exampleEnglish}
            usageNote={currentCard.usageNote}
            tag={currentCard.tag}
            onFlip={handleFlip}
            revealed={flipped}
            autoSpeak={autoPlayAudio}
            audioFirst={true}
            sentenceAudioReady={sentenceAudioIds.has(currentCard.id)}
          />
        </AnimatePresence>
      </div>

      <p className="mt-3 hidden text-center text-xs text-muted-foreground sm:block">
        Space reveals · 1 Again · 2 Good · 3 Easy · Esc closes
      </p>
    </PracticeShell>
  );
}

import { Button } from "@/components/ui/button";
import { X, Check, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { useSentenceAudioIds } from "@/hooks/useSentenceAudioIds";
import { ProductionAttempt } from "./study/ProductionAttempt";
import { StudySessionSummary } from "./study/StudySessionSummary";
import { NewCardIntro } from "./study/NewCardIntro";
import { useStudySession } from "./study/useStudySession";
import { PracticeShell } from "./practice/PracticeShell";
import { VocabularyCard } from "@/lib/vocabulary";
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
            <ProductionAttempt
              value={productionAttempt}
              onChange={setProductionAttempt}
              done={productionDone}
              onDone={() => setProductionDone(true)}
            />
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How did that feel?
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-red-100 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40 sm:h-24"
                  onClick={() => handleGrade("again")}
                >
                  <X size={24} />
                  <span>Again</span>
                  <span className="text-[10px] font-normal text-red-700 dark:text-red-300">
                    Rebuild tomorrow
                  </span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/40 sm:h-24"
                  onClick={() => handleGrade("good")}
                >
                  <Check size={24} />
                  <span>Good</span>
                  <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                    Build the interval
                  </span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-blue-100 text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/40 sm:h-24"
                  onClick={() => handleGrade("easy")}
                >
                  <Star size={24} />
                  <span>Easy</span>
                  <span className="text-[10px] font-normal text-blue-700 dark:text-blue-300">
                    Stretch the interval
                  </span>
                </Button>
              </motion.div>
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

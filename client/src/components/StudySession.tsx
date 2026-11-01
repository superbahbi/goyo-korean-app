import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { X, Check, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { useSentenceAudioIds } from "@/hooks/useSentenceAudioIds";
import { ProductionAttempt } from "./study/ProductionAttempt";
import { StudySessionSummary } from "./study/StudySessionSummary";
import { useStudySession } from "./study/useStudySession";
import { VocabularyCard } from "@/lib/vocabulary";

interface StudySessionProps {
  queue: VocabularyCard[];
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
  onGrade,
  onClose,
  allowRepeat = false,
  autoPlayAudio = true,
  title = "Daily Session",
}: StudySessionProps) {
  const study = useStudySession({ queue, onGrade, onClose });
  const sentenceAudioIds = useSentenceAudioIds();
  const {
    index,
    sessionQueue,
    currentCard,
    flipped,
    completed,
    results,
    retryCount,
    productionAttempt,
    setProductionAttempt,
    productionDone,
    setProductionDone,
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

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) closeSession();
      }}
    >
      <DialogContent
        aria-modal="true"
        aria-describedby={undefined}
        showCloseButton={false}
        className="inset-0 top-0 left-0 z-50 flex max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-card p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {flipped
            ? "Answer revealed. Press 1 for Again, 2 for Good, or 3 for Easy."
            : `Card ${index + 1} of ${sessionQueue.length}. Press Space to reveal.`}
        </p>
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b bg-gradient-to-r from-background to-muted">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSession}
            aria-label="Close study session"
          >
            <X />
          </Button>
          <div className="max-w-xs flex-1 px-4 sm:px-8">
            <Progress
              value={
                ((index + (flipped ? 0.5 : 0)) / sessionQueue.length) * 100
              }
              aria-label="Session progress"
              className="h-2"
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground min-w-[60px] text-right">
            {index + 1} / {sessionQueue.length}
            <span className="block text-xs text-muted-foreground">
              {title} · {flipped ? "Choose a rating" : "Recall first"}
            </span>
          </div>
        </header>

        {/* Main Study Area */}
        <main
          tabIndex={0}
          aria-label="Study card"
          className="min-h-0 flex-1 overflow-y-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset sm:p-6"
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
        </main>

        {/* Footer with Grading Buttons */}
        <footer className="shrink-0 border-t bg-muted/60 p-4 sm:p-8">
          {!flipped ? (
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
                    className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-red-100 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 sm:h-24"
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
                    className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 sm:h-24"
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
                    className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 sm:h-24"
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
          )}
          <p className="mt-3 hidden text-center text-xs text-muted-foreground sm:block">
            Space reveals · 1 Again · 2 Good · 3 Easy · Esc closes
          </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

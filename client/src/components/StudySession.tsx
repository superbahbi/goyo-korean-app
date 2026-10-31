import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { X, Check, Star, Mic2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { VocabularyCard } from "@/lib/vocabulary";
import { stopAudio } from "@/lib/audioPlayer";

interface StudySessionProps {
  queue: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good" | "easy", options?: { responseTimeMs?: number }) => void;
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
  const [index, setIndex] = useState(0);
  // A failed card re-enters the session once, so the queue can grow while the
  // session runs. Keep it local to avoid replaying the parent's original plan.
  const [sessionQueue, setSessionQueue] = useState<VocabularyCard[]>(() => [...queue]);
  const retriedIds = useRef(new Set<string>());
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState({ again: 0, good: 0, easy: 0 });
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

  const handleGrade = (rating: "again" | "good" | "easy") => {
    if (gradingLocked.current) return;
    gradingLocked.current = true;

    const responseTimeMs = Math.min(120000, Math.max(250, recallTimeMs.current ?? Date.now() - cardStartedAt.current));
    onGrade(currentCard.id, rating, { responseTimeMs });
    setResults((current) => ({ ...current, [rating]: current[rating] + 1 }));

    // A lapse comes back once, at the end, before the summary. The scheduler
    // already recorded the failure, so the re-grade changes no schedule.
    const shouldRetry = rating === "again" && !retriedIds.current.has(currentCard.id);
    if (shouldRetry) {
      retriedIds.current.add(currentCard.id);
      setSessionQueue((current) => [...current, currentCard]);
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
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

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

  if (completed) {
    const total = results.again + results.good + results.easy;
    const remembered = results.good + results.easy;
    const failedCards = retriedIds.current.size;
    const nextAction = failedCards > 0
      ? `${failedCards} card${failedCards === 1 ? " needs" : "s need"} a short rebuild tomorrow.`
      : results.easy === total
        ? "Excellent fluency signal—let the scheduler stretch these intervals."
        : "Keep the rhythm: another short session will strengthen today's recall.";
    return (
      <Dialog open onOpenChange={(open) => { if (!open) closeSession(); }}>
        <DialogContent
          aria-modal="true"
          aria-describedby={undefined}
          showCloseButton={false}
          className="inset-0 top-0 left-0 z-50 flex max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 overflow-y-auto rounded-none border-0 bg-slate-950/40 p-4 shadow-none backdrop-blur-sm sm:max-w-none"
        >
          <DialogTitle className="sr-only">Well practiced</DialogTitle>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={34} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Session complete</p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">Well practiced</h2>
            <p className="mt-3 text-slate-600">
              You remembered <strong>{remembered}</strong> of {total} reviews.
            </p>
            {failedCards > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                {failedCards} {failedCards === 1 ? "card came" : "cards came"} back once for a second try.
              </p>
            )}
            <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-700">{nextAction}</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-red-50 p-3"><div className="text-2xl font-bold text-red-600">{results.again}</div><div className="text-xs text-red-700">Again</div></div>
              <div className="rounded-2xl bg-emerald-50 p-3"><div className="text-2xl font-bold text-emerald-600">{results.good}</div><div className="text-xs text-emerald-700">Good</div></div>
              <div className="rounded-2xl bg-blue-50 p-3"><div className="text-2xl font-bold text-blue-600">{results.easy}</div><div className="text-xs text-blue-700">Easy</div></div>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="min-h-12 flex-1" onClick={closeSession}>Return to dashboard</Button>
              {allowRepeat && <Button className="min-h-12 flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={restartSession}>Practice again</Button>}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentCard) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) closeSession(); }}>
      <DialogContent
        aria-modal="true"
        aria-describedby={undefined}
        showCloseButton={false}
        className="inset-0 top-0 left-0 z-50 flex max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-white p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {flipped
            ? "Answer revealed. Press 1 for Again, 2 for Good, or 3 for Easy."
            : `Card ${index + 1} of ${sessionQueue.length}. Press Space to reveal.`}
        </p>
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <Button variant="ghost" size="icon" onClick={closeSession} aria-label="Close study session">
            <X />
          </Button>
          <div className="max-w-xs flex-1 px-4 sm:px-8">
            <Progress value={((index + (flipped ? 0.5 : 0)) / sessionQueue.length) * 100} className="h-2" />
          </div>
          <div className="text-sm font-medium text-slate-500 min-w-[60px] text-right">
            {index + 1} / {sessionQueue.length}
            <span className="block text-xs text-slate-400">{title} · {flipped ? "Choose a rating" : "Recall first"}</span>
          </div>
        </header>

        {/* Main Study Area */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
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
            />
          </AnimatePresence>
        </main>

        {/* Footer with Grading Buttons */}
        <footer className="shrink-0 border-t bg-slate-50 p-4 sm:p-8">
          {!flipped ? (
            <Button
              className="h-14 w-full rounded-2xl bg-slate-900 text-lg font-bold transition-all hover:bg-slate-800 sm:h-16 sm:text-xl"
              onClick={() => handleFlip(true)}
            >
              Reveal Korean &amp; Meaning
            </Button>
          ) : (
            <div>
              <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-left">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
                  <Mic2 size={16} />
                  Use it in a new situation
                </div>
                <p className="mt-1 text-xs leading-relaxed text-indigo-700">
                  Say a new sentence aloud with this Korean word or phrase. Writing your attempt is optional.
                </p>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={productionAttempt}
                    onChange={(event) => setProductionAttempt(event.target.value)}
                    placeholder="Your Korean sentence (optional)"
                    className="h-10 border-indigo-200 bg-white"
                    onClick={(event) => event.stopPropagation()}
                  />
                  <Button
                    type="button"
                    variant={productionDone ? "default" : "outline"}
                    className={productionDone ? "h-10 shrink-0 bg-indigo-600 hover:bg-indigo-700" : "h-10 shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-100"}
                    onClick={() => setProductionDone(true)}
                  >
                    {productionDone ? "Tried" : "Done"}
                  </Button>
                </div>
              </div>
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">How did that feel?</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-red-100 text-red-600 hover:bg-red-50 sm:h-24"
                  onClick={() => handleGrade("again")}
                >
                  <X size={24} />
                  <span>Again</span><span className="text-[10px] font-normal text-red-400">Rebuild tomorrow</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 sm:h-24"
                  onClick={() => handleGrade("good")}
                >
                  <Check size={24} />
                  <span>Good</span><span className="text-[10px] font-normal text-emerald-400">Build the interval</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="h-20 w-full flex-col gap-1 rounded-2xl border-2 border-blue-100 text-blue-600 hover:bg-blue-50 sm:h-24"
                  onClick={() => handleGrade("easy")}
                >
                  <Star size={24} />
                  <span>Easy</span><span className="text-[10px] font-normal text-blue-400">Stretch the interval</span>
                </Button>
              </motion.div>
              </div>
            </div>
          )}
          <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block">
            Space reveals · 1 Again · 2 Good · 3 Easy · Esc closes
          </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

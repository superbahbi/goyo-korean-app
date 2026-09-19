import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Check, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { VocabularyCard } from "@/lib/vocabulary";
import { stopAudio } from "@/lib/audioPlayer";

interface StudySessionProps {
  queue: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good" | "easy") => void;
  onClose: () => void;
  allowRepeat?: boolean;
}

export function StudySession({ queue, onGrade, onClose, allowRepeat = false }: StudySessionProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState({ again: 0, good: 0, easy: 0 });

  const closeSession = () => {
    stopAudio();
    onClose();
  };

  const currentCard = queue[index];
  const isLastCard = index >= queue.length - 1;

  const handleGrade = (rating: "again" | "good" | "easy") => {
    onGrade(currentCard.id, rating);
    setResults((current) => ({ ...current, [rating]: current[rating] + 1 }));

    if (!isLastCard) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      setCompleted(true);
    }
  };

  const restartSession = () => {
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
    setResults({ again: 0, good: 0, easy: 0 });
  };

  if (completed) {
    const total = results.again + results.good + results.easy;
    const remembered = results.good + results.easy;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
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
            You remembered <strong>{remembered}</strong> of {total} cards.
          </p>
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
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-slate-100">
        <Button variant="ghost" size="icon" onClick={closeSession}>
          <X />
        </Button>
        <div className="max-w-xs flex-1 px-4 sm:px-8">
          <Progress value={((index + (flipped ? 0.5 : 0)) / queue.length) * 100} className="h-2" />
        </div>
        <div className="text-sm font-medium text-slate-500 min-w-[60px] text-right">
          {index + 1} / {queue.length}
          <span className="block text-xs text-slate-400">{flipped ? "Choose a rating" : "Recall first"}</span>
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
            example={currentCard.example}
            tag={currentCard.tag}
            onFlip={setFlipped}
            autoSpeak={true}
          />
        </AnimatePresence>
      </main>

      {/* Footer with Grading Buttons */}
      <footer className="shrink-0 border-t bg-slate-50 p-4 sm:p-8">
        {!flipped ? (
          <Button
            className="h-14 w-full rounded-2xl bg-slate-900 text-lg font-bold transition-all hover:bg-slate-800 sm:h-16 sm:text-xl"
            onClick={() => setFlipped(true)}
          >
            Reveal Answer
          </Button>
        ) : (
          <div>
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
                <span>Again</span><span className="text-[10px] font-normal text-red-400">Tomorrow</span>
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
                <span>Good</span><span className="text-[10px] font-normal text-emerald-400">In 2 days</span>
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
                <span>Easy</span><span className="text-[10px] font-normal text-blue-400">In 4 days</span>
              </Button>
            </motion.div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

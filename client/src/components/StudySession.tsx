import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Check, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { VocabularyCard } from "@/lib/vocabulary";

interface StudySessionProps {
  queue: VocabularyCard[];
  onGrade: (cardId: string, rating: "again" | "good" | "easy") => void;
  onClose: () => void;
  allowRepeat?: boolean;
}

export function StudySession({ queue, onGrade, onClose, allowRepeat = false }: StudySessionProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentCard = queue[index];
  const isLastCard = index >= queue.length - 1;

  const handleGrade = (rating: "again" | "good" | "easy") => {
    onGrade(currentCard.id, rating);

    if (!isLastCard) {
      setIndex(index + 1);
      setFlipped(false);
    } else if (allowRepeat) {
      // Allow repeating the session
      setIndex(0);
      setFlipped(false);
    } else {
      onClose();
    }
  };

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-slate-100">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
        <div className="flex-1 px-8 max-w-xs">
          <Progress value={(index / queue.length) * 100} className="h-2" />
        </div>
        <div className="text-sm font-medium text-slate-500 min-w-[60px] text-right">
          {index + 1} / {queue.length}
          {allowRepeat && <span className="text-xs text-emerald-600 block">Repeatable</span>}
        </div>
      </header>

      {/* Main Study Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <FlashCard
            key={currentCard.id}
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
      <footer className="p-8 border-t bg-slate-50">
        {!flipped ? (
          <Button
            className="w-full h-16 rounded-2xl text-xl font-bold bg-slate-900 hover:bg-slate-800 transition-all"
            onClick={() => setFlipped(true)}
          >
            Reveal Answer
          </Button>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-1 border-2 border-red-100 hover:bg-red-50 text-red-600 rounded-2xl font-bold"
                onClick={() => handleGrade("again")}
              >
                <X size={24} />
                <span>Again</span>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-1 border-2 border-emerald-100 hover:bg-emerald-50 text-emerald-600 rounded-2xl font-bold"
                onClick={() => handleGrade("good")}
              >
                <Check size={24} />
                <span>Good</span>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-1 border-2 border-blue-100 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold"
                onClick={() => handleGrade("easy")}
              >
                <Star size={24} />
                <span>Easy</span>
              </Button>
            </motion.div>
          </div>
        )}
      </footer>
    </div>
  );
}

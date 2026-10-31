import { Brain, BookOpen, Headphones, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface PracticeMenuProps {
  weakCardCount: number;
  learningCardCount: number;
  onOpenAlphabet: () => void;
  onOpenListening: () => void;
  onOpenScenarios: () => void;
  onOpenShadowing: () => void;
  onStartWeakSession: () => void;
  onStartLearningSession: () => void;
}

/** Secondary practice entry points below the daily plan. */
export function PracticeMenu({
  weakCardCount,
  learningCardCount,
  onOpenAlphabet,
  onOpenListening,
  onOpenScenarios,
  onOpenShadowing,
  onStartWeakSession,
  onStartLearningSession,
}: PracticeMenuProps) {
  return (
    <>
      {/* Hangul Practice Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onOpenAlphabet}
        className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base hover:shadow-lg transition-all"
      >
        <div className="text-2xl mb-1">🔤</div>
        Learn Hangul (Korean Alphabet)
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onOpenListening}
        className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-base hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-center gap-2 text-2xl mb-1">
          <Headphones size={25} />
        </div>
        Listening Practice
        <div className="text-xs font-normal text-slate-300 mt-1">
          10 audio-first questions · due and weak cards first
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onOpenScenarios}
        className="mb-6 w-full rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg"
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
          <MapPin size={25} />
        </div>
        Survival Scenarios
        <div className="mt-1 text-xs font-normal text-rose-50">
          Real-world situations · reviewed phrases only
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onOpenShadowing}
        className="mb-6 w-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg"
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
          <Headphones size={25} />
        </div>
        Shadowing Practice
        <div className="mt-1 text-xs font-normal text-indigo-50">
          8 phrases · practice only, your schedule stays put
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onStartWeakSession}
        disabled={weakCardCount === 0}
        className="w-full mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
          <Brain size={25} />
        </div>
        Weak Words
        <div className="mt-1 text-xs font-normal text-amber-50">
          {weakCardCount > 0
            ? `${weakCardCount} cards selected from your lowest recall`
            : "Review a few cards to unlock personalized training"}
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onStartLearningSession}
        className="mb-6 w-full rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        disabled={learningCardCount === 0}
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
          <BookOpen size={25} />
        </div>
        Learning Review
        <div className="mt-1 text-xs font-normal text-blue-50">
          {learningCardCount > 0
            ? `${learningCardCount} Learning and Shaky cards need another pass`
            : "Cards will appear here as you begin reviewing"}
        </div>
      </motion.button>
    </>
  );
}

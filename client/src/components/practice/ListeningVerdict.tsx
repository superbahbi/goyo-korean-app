import { type RefObject } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type VocabularyCard } from "@/lib/vocabulary";

interface ListeningVerdictProps {
  card: VocabularyCard;
  answered: boolean;
  correct: boolean;
  isLast: boolean;
  nextButtonRef: RefObject<HTMLButtonElement | null>;
  onNext: () => void;
}

export function ListeningVerdict({
  card,
  answered,
  correct,
  isLast,
  nextButtonRef,
  onNext,
}: ListeningVerdictProps) {
  return (
    <div aria-live="polite">
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl bg-white/80 p-4 text-center"
        >
          <p
            className={`font-semibold ${correct ? "text-emerald-700" : "text-red-700"}`}
          >
            {correct
              ? "Correct — nice listening."
              : `The answer is “${card.back}”.`}
          </p>
          <p className="mt-1 text-sm text-slate-500" lang="ko">
            {card.example}
          </p>
          <Button
            ref={nextButtonRef}
            onClick={onNext}
            className="mt-4 min-h-12 w-full bg-slate-900 hover:bg-slate-800"
          >
            {isLast ? "See results" : "Next recording"}
            <ArrowLeft size={16} className="ml-2 rotate-180" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

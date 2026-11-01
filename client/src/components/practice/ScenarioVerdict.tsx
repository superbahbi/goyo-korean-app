import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { type VocabularyCard } from "@/lib/vocabulary";

interface ScenarioVerdictProps {
  card: VocabularyCard;
  answered: boolean;
  correct: boolean;
  isLast: boolean;
  onNext: () => void;
}

export function ScenarioVerdict({
  card,
  answered,
  correct,
  isLast,
  onNext,
}: ScenarioVerdictProps) {
  return (
    <div aria-live="polite">
      {answered && (
        <div className="mt-5 rounded-2xl bg-white/85 p-5 text-center">
          <p
            className={`font-semibold ${correct ? "text-emerald-700" : "text-red-700"}`}
          >
            {correct ? (
              "That fits the situation."
            ) : (
              <>
                A useful answer is “<span lang="ko">{card.front}</span>”.
              </>
            )}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {card.back} · <span lang="ko">{card.example}</span>
          </p>
          <Button
            className="mt-4 min-h-12 w-full bg-slate-900 hover:bg-slate-800"
            onClick={onNext}
          >
            {isLast ? "See results" : "Next situation"}
            <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

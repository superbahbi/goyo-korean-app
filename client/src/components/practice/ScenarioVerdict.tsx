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
        <div className="mt-5 rounded-2xl bg-card/85 p-5 text-center">
          <p
            className={`font-semibold ${correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}
          >
            {correct ? (
              "That fits the situation."
            ) : (
              <>
                A useful answer is “<span lang="ko">{card.front}</span>”.
              </>
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {card.back} · <span lang="ko">{card.example}</span>
          </p>
          <Button
            className="mt-4 min-h-12 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
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

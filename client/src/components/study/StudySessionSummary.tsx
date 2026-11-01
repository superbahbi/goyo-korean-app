import { Check } from "lucide-react";
import { PracticeComplete } from "@/components/practice/PracticeComplete";
import { StudyResults } from "./useStudySession";

interface StudySessionSummaryProps {
  results: StudyResults;
  failedCards: number;
  allowRepeat: boolean;
  onClose: () => void;
  onRestart: () => void;
}

export function StudySessionSummary({
  results,
  failedCards,
  allowRepeat,
  onClose,
  onRestart,
}: StudySessionSummaryProps) {
  const total = results.again + results.good + results.easy;
  const remembered = results.good + results.easy;
  const nextAction =
    failedCards > 0
      ? `${failedCards} card${failedCards === 1 ? " needs" : "s need"} a short rebuild tomorrow.`
      : results.easy === total
        ? "Excellent fluency signal—let the scheduler stretch these intervals."
        : "Keep the rhythm: another short session will strengthen today's recall.";

  return (
    <PracticeComplete
      title="Well practiced"
      eyebrow="Session complete"
      heading="Well practiced"
      icon={<Check size={34} />}
      tone="emerald"
      closeLabel="Return to dashboard"
      restartLabel={allowRepeat ? "Practice again" : undefined}
      restartClassName="bg-emerald-700 hover:bg-emerald-800"
      onClose={onClose}
      onRestart={allowRepeat ? onRestart : undefined}
      details={
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-red-50 p-3 dark:bg-red-950/40">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {results.again}
            </div>
            <div className="text-xs text-red-700 dark:text-red-300">Again</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {results.good}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              Good
            </div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 dark:bg-blue-950/40">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {results.easy}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Easy</div>
          </div>
        </div>
      }
    >
      <p>
        You remembered <strong>{remembered}</strong> of {total} reviews.
      </p>
      {failedCards > 0 && (
        <p className="text-sm text-muted-foreground">
          {failedCards} {failedCards === 1 ? "card came" : "cards came"} back
          once for a second try.
        </p>
      )}
      <p className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
        {nextAction}
      </p>
    </PracticeComplete>
  );
}

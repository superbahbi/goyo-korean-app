import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
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
    <Dialog
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
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
          className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-2xl sm:p-8"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <Check size={34} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            Session complete
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Well practiced
          </h2>
          <p className="mt-3 text-foreground/70">
            You remembered <strong>{remembered}</strong> of {total} reviews.
          </p>
          {failedCards > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {failedCards} {failedCards === 1 ? "card came" : "cards came"}{" "}
              back once for a second try.
            </p>
          )}
          <p className="mt-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 px-4 py-3 text-sm leading-relaxed text-indigo-700 dark:text-indigo-300">
            {nextAction}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 p-3">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {results.again}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300">
                Again
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-3">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {results.good}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                Good
              </div>
            </div>
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/40 p-3">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {results.easy}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Easy
              </div>
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="min-h-12 flex-1"
              onClick={onClose}
            >
              Return to dashboard
            </Button>
            {allowRepeat && (
              <Button
                className="min-h-12 flex-1 bg-emerald-700 hover:bg-emerald-800"
                onClick={onRestart}
              >
                Practice again
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

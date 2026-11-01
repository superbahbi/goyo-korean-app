import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PracticeFeedbackProps {
  answered: boolean;
  correct: boolean;
  correctText: string;
  wrongText: ReactNode;
  detail?: ReactNode;
}

/**
 * The post-answer verdict shared by recognition practice. The live region stays
 * mounted so the result is announced instead of appearing silently.
 */
export function PracticeFeedback({
  answered,
  correct,
  correctText,
  wrongText,
  detail,
}: PracticeFeedbackProps) {
  return (
    <div aria-live="polite">
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl border border-border bg-card/85 p-4 text-center"
        >
          <p
            className={cn(
              "font-semibold",
              correct
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            )}
          >
            {correct ? correctText : wrongText}
          </p>
          {detail && (
            <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

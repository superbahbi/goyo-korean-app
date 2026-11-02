import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PracticeFeedbackProps {
  answered: boolean;
  correct: boolean;
  correctText: string;
  wrongText: ReactNode;
  detail?: ReactNode;
  /** A mode-specific action, such as the grammar check's next button. */
  action?: ReactNode;
  /** Extra classes merged onto the verdict card. */
  className?: string;
  /** Extra classes merged onto the verdict line. */
  textClassName?: string;
  /** Extra classes merged onto the detail line. */
  detailClassName?: string;
  /** Recognition modes animate the card in; the grammar check does not. */
  animate?: boolean;
}

/**
 * The post-answer verdict shared by every practice mode. The live region stays
 * mounted so the result is announced instead of appearing silently. Modes that
 * need their own spacing, emphasis, or action merge those classes in rather than
 * rebuilding the block.
 */
export function PracticeFeedback({
  answered,
  correct,
  correctText,
  wrongText,
  detail,
  action,
  className,
  textClassName,
  detailClassName,
  animate = true,
}: PracticeFeedbackProps) {
  const cardClassName = cn(
    "mt-5 rounded-2xl border border-border bg-card/85 p-4 text-center",
    className
  );

  const content = (
    <>
      <p
        className={cn(
          "font-semibold",
          correct
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-red-700 dark:text-red-300",
          textClassName
        )}
      >
        {correct ? correctText : wrongText}
      </p>
      {detail && (
        <p
          className={cn("mt-1 text-sm text-muted-foreground", detailClassName)}
        >
          {detail}
        </p>
      )}
      {action}
    </>
  );

  return (
    <div aria-live="polite">
      {answered &&
        (animate ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cardClassName}
          >
            {content}
          </motion.div>
        ) : (
          <div className={cardClassName}>{content}</div>
        ))}
    </div>
  );
}

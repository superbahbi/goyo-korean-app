import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  practiceToneBackground,
  type PracticeTone,
} from "@/components/practice/PracticeShell";

interface PracticeCompleteProps {
  /** Dialog label; also the heading when `heading` is omitted. */
  title: string;
  eyebrow: string;
  heading?: string;
  icon: ReactNode;
  closeLabel: string;
  /** Accent wash matching the practice mode that just finished. */
  tone?: PracticeTone;
  /** Omit both restart props to show a single close action. */
  restartLabel?: ReactNode;
  restartClassName?: string;
  onClose: () => void;
  onRestart?: () => void;
  /** Extra output such as a result breakdown, below the summary. */
  details?: ReactNode;
  children: ReactNode;
}

/** The one completion screen shared by every practice mode. */
export function PracticeComplete({
  title,
  eyebrow,
  heading,
  icon,
  closeLabel,
  tone = "emerald",
  restartLabel,
  restartClassName = "bg-emerald-600 hover:bg-emerald-700",
  onClose,
  onRestart,
  details,
  children,
}: PracticeCompleteProps) {
  const canRestart = Boolean(restartLabel && onRestart);
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
        className={cn(
          // Opaque, full-screen finish screen: the dashboard behind the practice
          // must never leak through, so this reuses the shell's tone wash
          // instead of a translucent scrim.
          "inset-0 top-0 left-0 z-50 data-[state=open]:animate-none data-[state=closed]:animate-none flex max-w-none translate-x-0 translate-y-0 items-center justify-center gap-0 overflow-y-auto rounded-none border-0 p-4 shadow-none sm:max-w-none",
          practiceToneBackground[tone],
          // Opaque base colour beneath the wash, so the dashboard can never
          // show through even if the gradient image fails to paint.
          "[background-color:var(--background)]"
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-2xl sm:p-8"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            {icon}
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight text-foreground">
            {heading ?? title}
          </h2>
          <div className="mt-3 space-y-2 text-foreground/70">{children}</div>
          {details && <div className="mt-5">{details}</div>}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="min-h-12 flex-1"
              onClick={onClose}
            >
              {closeLabel}
            </Button>
            {canRestart && (
              <Button
                className={`min-h-12 flex-1 ${restartClassName}`}
                onClick={onRestart}
              >
                {restartLabel}
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

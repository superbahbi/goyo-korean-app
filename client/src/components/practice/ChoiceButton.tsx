import { Check, X } from "lucide-react";

interface ChoiceButtonProps {
  letter: string;
  label: string;
  labelLang?: string;
  answered: boolean;
  chosen: boolean;
  correct: boolean;
  onChoose: () => void;
}

/** One answer option, styled identically across every practice mode. */
export function ChoiceButton({
  letter,
  label,
  labelLang,
  answered,
  chosen,
  correct,
  onChoose,
}: ChoiceButtonProps) {
  const stateClass = !answered
    ? "border-border bg-card hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
    : correct
      ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
      : chosen
        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200"
        : "border-border/70 bg-card/70 text-muted-foreground/80";
  return (
    <button
      type="button"
      disabled={answered}
      onClick={onChoose}
      className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${stateClass}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
        {letter}
      </span>
      <span className="flex-1" lang={labelLang}>
        {label}
      </span>
      {answered && correct && (
        <Check
          size={20}
          className="shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
      )}
      {answered && chosen && !correct && (
        <X
          size={20}
          className="shrink-0 text-red-500 dark:text-red-400"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

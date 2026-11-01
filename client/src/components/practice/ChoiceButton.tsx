import { type ReactNode } from "react";

interface ChoiceButtonProps {
  letter: string;
  label: string;
  labelLang?: string;
  answered: boolean;
  chosen: boolean;
  correct: boolean;
  onChoose: () => void;
  sizeClass: string;
  correctIcon: ReactNode;
  wrongIcon: ReactNode;
}

export function ChoiceButton({
  letter,
  label,
  labelLang,
  answered,
  chosen,
  correct,
  onChoose,
  sizeClass,
  correctIcon,
  wrongIcon,
}: ChoiceButtonProps) {
  const stateClass = !answered
    ? "border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50"
    : correct
      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
      : chosen
        ? "border-red-300 bg-red-50 text-red-800"
        : "border-slate-100 bg-white/70 text-slate-400";
  return (
    <button
      disabled={answered}
      onClick={onChoose}
      className={`flex ${sizeClass} items-center gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${stateClass}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
        {letter}
      </span>
      <span className="flex-1" lang={labelLang}>
        {label}
      </span>
      {answered && correct && correctIcon}
      {answered && chosen && !correct && wrongIcon}
    </button>
  );
}

import { SectionHeading } from "@/components/SectionHeading";
import {
  BookMarked,
  BookOpen,
  Brain,
  Headphones,
  Languages,
  MapPin,
  Mic,
} from "lucide-react";

interface PracticeMenuProps {
  weakCardCount: number;
  learningCardCount: number;
  grammarCompleted: number;
  onOpenAlphabet: () => void;
  onOpenGrammar: () => void;
  onOpenListening: () => void;
  onOpenScenarios: () => void;
  onOpenShadowing: () => void;
  onStartWeakSession: () => void;
  onStartLearningSession: () => void;
}

/**
 * Secondary practice entry points, laid out as compact tiles so the daily
 * session stays the one loud action on the dashboard.
 */
export function PracticeMenu({
  weakCardCount,
  learningCardCount,
  grammarCompleted,
  onOpenAlphabet,
  onOpenGrammar,
  onOpenListening,
  onOpenScenarios,
  onOpenShadowing,
  onStartWeakSession,
  onStartLearningSession,
}: PracticeMenuProps) {
  const tiles = [
    {
      key: "hangul",
      title: "Learn Hangul",
      meta: "Korean alphabet",
      icon: Languages,
      tone: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
      onClick: onOpenAlphabet,
      disabled: false,
    },
    {
      key: "grammar",
      title: "Grammar Lessons",
      meta:
        grammarCompleted > 0
          ? `${grammarCompleted} of 12 lessons complete`
          : "12 TOPIK I patterns",
      icon: BookMarked,
      tone: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300",
      onClick: onOpenGrammar,
      disabled: false,
    },
    {
      key: "listening",
      title: "Listening Practice",
      meta: "10 audio-first questions",
      icon: Headphones,
      tone: "bg-muted text-foreground/80",
      onClick: onOpenListening,
      disabled: false,
    },
    {
      key: "scenarios",
      title: "Survival Scenarios",
      meta: "Real-world reviewed phrases",
      icon: MapPin,
      tone: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
      onClick: onOpenScenarios,
      disabled: false,
    },
    {
      key: "shadowing",
      title: "Shadowing Practice",
      meta: "8 phrases · practice only",
      icon: Mic,
      tone: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
      onClick: onOpenShadowing,
      disabled: false,
    },
    {
      key: "weak",
      title: "Weak Words",
      meta:
        weakCardCount > 0
          ? `${weakCardCount} low-recall cards`
          : "Unlocks after a few reviews",
      icon: Brain,
      tone: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
      onClick: onStartWeakSession,
      disabled: weakCardCount === 0,
    },
    {
      key: "learning",
      title: "Learning Review",
      meta:
        learningCardCount > 0
          ? `${learningCardCount} cards need another pass`
          : "Unlocks as you review",
      icon: BookOpen,
      tone: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400",
      onClick: onStartLearningSession,
      disabled: learningCardCount === 0,
    },
  ] as const;

  return (
    <section className="space-y-3" aria-labelledby="practice-heading">
      <SectionHeading
        id="practice-heading"
        eyebrow="Beyond the daily queue"
        title="Practice"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {tiles.map(tile => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={tile.onClick}
              disabled={tile.disabled}
              className="group flex min-h-[92px] flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:p-4"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile.tone}`}
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <span className="block min-w-0">
                <span className="block text-sm font-semibold leading-snug text-foreground/90 sm:text-[15px]">
                  {tile.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {tile.meta}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

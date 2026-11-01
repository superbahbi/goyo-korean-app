import { SectionHeading } from "@/components/SectionHeading";
import {
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
  onOpenAlphabet: () => void;
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
  onOpenAlphabet,
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
      tone: "bg-indigo-50 text-indigo-600",
      onClick: onOpenAlphabet,
      disabled: false,
    },
    {
      key: "listening",
      title: "Listening Practice",
      meta: "10 audio-first questions",
      icon: Headphones,
      tone: "bg-slate-100 text-slate-700",
      onClick: onOpenListening,
      disabled: false,
    },
    {
      key: "scenarios",
      title: "Survival Scenarios",
      meta: "Real-world reviewed phrases",
      icon: MapPin,
      tone: "bg-rose-50 text-rose-600",
      onClick: onOpenScenarios,
      disabled: false,
    },
    {
      key: "shadowing",
      title: "Shadowing Practice",
      meta: "8 phrases · practice only",
      icon: Mic,
      tone: "bg-violet-50 text-violet-600",
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
      tone: "bg-amber-50 text-amber-600",
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
      tone: "bg-sky-50 text-sky-600",
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
              className="group flex min-h-[92px] flex-col items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:p-4"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile.tone}`}
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <span className="block min-w-0">
                <span className="block text-sm font-semibold leading-snug text-slate-800 sm:text-[15px]">
                  {tile.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500">
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

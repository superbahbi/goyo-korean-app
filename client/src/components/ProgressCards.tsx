import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TodayProgress } from "@/lib/dashboardProgress";
import { BookOpen, Languages, Play, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressCardsProps {
  firstRun: boolean;
  todayProgress: TodayProgress;
  level: number;
  levelTitle: string;
  levelProgress: number;
  totalXp: number;
  nextLevelXp: number;
  totalCardsLearned: number;
  studyReadyCount: number;
  onStartSession: () => void;
  onOpenAlphabet: () => void;
}

/** Compact stat strip, or the first-run "start here" block. */
export function ProgressCards({
  firstRun,
  todayProgress,
  level,
  levelTitle,
  levelProgress,
  totalXp,
  nextLevelXp,
  totalCardsLearned,
  studyReadyCount,
  onStartSession,
  onOpenAlphabet,
}: ProgressCardsProps) {
  if (firstRun) {
    const words = todayProgress.planned;
    return (
      <motion.section
        aria-labelledby="start-here-heading"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="gap-0 border-emerald-200/70 bg-card py-0 shadow-sm dark:border-emerald-900/60">
          <div className="p-4 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Start here
            </p>
            <h2
              id="start-here-heading"
              className="mt-1 font-serif text-xl leading-tight text-foreground sm:text-2xl"
            >
              Your first session
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Reviews come back tomorrow, and each short session builds your
              schedule.
            </p>

            <div className="mt-4 max-w-md rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {todayProgress.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {todayProgress.goalLine}
                </span>
              </div>
              <Progress
                value={todayProgress.percent}
                aria-label="Today's planned cards studied"
                className="mt-2 h-1.5 bg-muted"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onStartSession}
                className="flex h-11 touch-manipulation items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 active:scale-[0.99] dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 sm:text-base"
              >
                <Play
                  className="mr-2 fill-current"
                  size={18}
                  aria-hidden="true"
                />
                Start first session ·{" "}
                {words === 1 ? "1 new word" : `${words} new words`}
              </button>
              <button
                type="button"
                onClick={onOpenAlphabet}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-foreground/70 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:hover:text-emerald-300"
              >
                <Languages size={16} aria-hidden="true" />
                Prefer to start with Hangul?
              </button>
            </div>
          </div>
        </Card>
      </motion.section>
    );
  }

  const learnedPercent =
    studyReadyCount > 0
      ? Math.round((totalCardsLearned / studyReadyCount) * 100)
      : 0;

  const tiles = [
    {
      key: "today",
      label: "Today",
      icon: BookOpen,
      value: todayProgress.label,
      percent: todayProgress.percent,
      ariaLabel: "Today's planned cards studied",
      detail: todayProgress.goalLine,
      showDetailOnMobile: true,
    },
    {
      key: "level",
      label: `Level ${level}`,
      icon: Zap,
      value: levelTitle,
      percent: levelProgress,
      ariaLabel: `Level ${level} progress`,
      detail: `${Math.max(0, nextLevelXp - totalXp)} XP to next level`,
      showDetailOnMobile: false,
    },
    {
      key: "learned",
      label: "Learned",
      icon: TrendingUp,
      value: String(totalCardsLearned),
      percent: learnedPercent,
      ariaLabel: "Share of the deck learned",
      detail: `${learnedPercent}% of ${studyReadyCount} study-ready cards`,
      showDetailOnMobile: false,
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {tiles.map((tile, index) => {
        const Icon = tile.icon;
        const isToday = tile.key === "today";
        return (
          <motion.div
            key={tile.key}
            className="min-w-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Card className="h-full gap-0 border-border/70 bg-card py-0 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-full flex-col p-3 sm:p-5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                  <Icon size={14} aria-hidden="true" />
                  <span className="truncate">{tile.label}</span>
                </div>
                <div
                  className={`mt-1.5 font-bold text-foreground tabular-nums ${
                    isToday
                      ? "text-lg leading-tight sm:text-2xl"
                      : "truncate text-xl sm:text-3xl"
                  }`}
                >
                  {tile.value}
                </div>
                <Progress
                  value={tile.percent}
                  aria-label={tile.ariaLabel}
                  className="mt-2 h-1.5 bg-muted"
                />
                <p
                  className={`mt-2 text-[11px] leading-snug text-muted-foreground sm:text-xs ${
                    tile.showDetailOnMobile ? "" : "hidden sm:block"
                  }`}
                >
                  {tile.detail}
                </p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

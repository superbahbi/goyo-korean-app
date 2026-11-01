import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressCardsProps {
  cardsStudiedToday: number;
  dailyGoal: number;
  newCardsPerDay: number;
  progressPercent: number;
  level: number;
  levelTitle: string;
  levelProgress: number;
  totalXp: number;
  nextLevelXp: number;
  totalCardsLearned: number;
  studyReadyCount: number;
}

/** Compact stat strip: today's goal, level progress, and deck coverage. */
export function ProgressCards({
  cardsStudiedToday,
  dailyGoal,
  newCardsPerDay,
  progressPercent,
  level,
  levelTitle,
  levelProgress,
  totalXp,
  nextLevelXp,
  totalCardsLearned,
  studyReadyCount,
}: ProgressCardsProps) {
  const learnedPercent =
    studyReadyCount > 0
      ? Math.round((totalCardsLearned / studyReadyCount) * 100)
      : 0;

  const tiles = [
    {
      key: "today",
      label: "Today",
      icon: BookOpen,
      value: `${cardsStudiedToday}/${dailyGoal}`,
      percent: progressPercent,
      ariaLabel: "Today's cards studied",
      detail: `Cards studied today · up to ${newCardsPerDay} new ${
        newCardsPerDay === 1 ? "word" : "words"
      } per day`,
    },
    {
      key: "level",
      label: `Level ${level}`,
      icon: Zap,
      value: levelTitle,
      percent: levelProgress,
      ariaLabel: `Level ${level} progress`,
      detail: `${Math.max(0, nextLevelXp - totalXp)} XP to next level`,
    },
    {
      key: "learned",
      label: "Learned",
      icon: TrendingUp,
      value: String(totalCardsLearned),
      percent: learnedPercent,
      ariaLabel: "Share of the deck learned",
      detail: `${learnedPercent}% of ${studyReadyCount} study-ready cards`,
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {tiles.map((tile, index) => {
        const Icon = tile.icon;
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
                <div className="mt-1.5 truncate text-xl font-bold text-foreground tabular-nums sm:text-3xl">
                  {tile.value}
                </div>
                <Progress
                  value={tile.percent}
                  aria-label={tile.ariaLabel}
                  className="mt-2 h-1.5 bg-muted"
                />
                <p className="mt-2 hidden text-xs leading-snug text-muted-foreground sm:block">
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Target } from "lucide-react";
import { CategoryMasteryList } from "@/components/stats/CategoryMasteryList";
import { ForecastOutlook } from "@/components/stats/ForecastOutlook";
import { MasteryBreakdown } from "@/components/stats/MasteryBreakdown";
import { StatsSummaryTiles } from "@/components/stats/StatsSummaryTiles";
import type {
  StatsDialogForecast,
  StatsDialogStats,
} from "@/components/stats/types";

export type {
  CategoryMastery,
  StatsDialogForecast,
  StatsDialogStats,
  StatsForecastDay,
} from "@/components/stats/types";

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: StatsDialogStats;
  forecast: StatsDialogForecast;
  today: string;
}

export function StatsDialog({
  open,
  onOpenChange,
  stats,
  forecast,
  today,
}: StatsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Target
              size={20}
              className="text-emerald-700 dark:text-emerald-300"
            />{" "}
            Your Korean ability
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/70">
            Progress measured by recall, coverage, and durable review—not just
            completion.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-100 dark:shadow-black/40">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Current level
              </p>
              <h3 className="mt-1 font-serif text-3xl">{stats.levelTitle}</h3>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.level}</div>
              <div className="text-xs text-emerald-100">level</div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${stats.levelProgress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-xs text-emerald-100">
            <span>{stats.totalXp} XP earned</span>
            <span>
              {Math.max(0, stats.nextLevelXp - stats.totalXp)} XP to next level
            </span>
          </div>
        </div>
        <StatsSummaryTiles stats={stats} />
        <MasteryBreakdown masteryCounts={stats.masteryCounts} />
        <CategoryMasteryList categories={stats.categories} />
        <ForecastOutlook forecast={forecast} today={today} />
      </DialogContent>
    </Dialog>
  );
}

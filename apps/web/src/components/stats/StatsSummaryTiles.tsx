import type { StatsDialogStats } from "@/components/stats/types";

interface StatsSummaryTilesProps {
  stats: StatsDialogStats;
}

export function StatsSummaryTiles({ stats }: StatsSummaryTilesProps) {
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-yellow-200 dark:border-yellow-800/70 bg-yellow-50 dark:bg-yellow-950/40 p-3 sm:p-4">
          <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
            Total XP
          </div>
          <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
            {stats.totalXp}
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 dark:border-orange-800/70 bg-orange-50 dark:bg-orange-950/40 p-3 sm:p-4">
          <div className="text-xs font-medium text-orange-700 dark:text-orange-300">
            Streak
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {stats.streak}d
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50 dark:bg-indigo-950/40 p-3 sm:p-4">
          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Recall
          </div>
          <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
            {stats.overallAccuracy}%
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 p-3 sm:p-4">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Known
          </div>
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.masteredCount}
          </div>
        </div>
        <div className="col-span-2 rounded-2xl border border-cyan-200 dark:border-cyan-800/70 bg-cyan-50 dark:bg-cyan-950/40 p-3 sm:p-4 sm:col-span-1">
          <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
            Recall tempo
          </div>
          <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
            {stats.medianResponseTime
              ? `${Math.round(stats.medianResponseTime / 1000)}s`
              : "—"}
          </div>
          <div className="mt-1 text-[11px] text-cyan-700 dark:text-cyan-300">
            median response
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/70 pt-5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/60 p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Reviews
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {stats.totalReviews}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            total attempts
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/40 p-3">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Learning
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.masteryCounts.learning}
          </div>
          <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
            cards in progress
          </div>
        </div>
        <div className="col-span-2 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 p-3 sm:col-span-1">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Due now
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.overdueCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
            reviews
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50 dark:bg-indigo-950/40 p-3">
          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Days studied · last 7
          </div>
          <div className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {stats.daysStudied7} / 7
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400">
            days · {stats.reviews7} review
            {stats.reviews7 === 1 ? "" : "s"}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/40 p-3">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Days studied · last 30
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.daysStudied30} / 30
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
            days with a review
          </div>
        </div>
      </div>
    </>
  );
}

import type { StatsDialogStats } from "@/components/stats/types";

interface StatsSummaryTilesProps {
  stats: StatsDialogStats;
}

export function StatsSummaryTiles({ stats }: StatsSummaryTilesProps) {
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="text-xs text-yellow-700 font-medium">Total XP</div>
          <div className="text-3xl font-bold text-yellow-700">
            {stats.totalXp}
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="text-xs font-medium text-orange-700">Streak</div>
          <div className="text-3xl font-bold text-orange-700">
            {stats.streak}d
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="text-xs font-medium text-indigo-700">Recall</div>
          <div className="text-3xl font-bold text-indigo-700">
            {stats.overallAccuracy}%
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-medium text-emerald-700">Known</div>
          <div className="text-3xl font-bold text-emerald-700">
            {stats.masteredCount}
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <div className="text-xs font-medium text-cyan-700">Recall tempo</div>
          <div className="text-3xl font-bold text-cyan-700">
            {stats.medianResponseTime
              ? `${Math.round(stats.medianResponseTime / 1000)}s`
              : "—"}
          </div>
          <div className="mt-1 text-[11px] text-cyan-700">median response</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-medium text-slate-500">Reviews</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {stats.totalReviews}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">total attempts</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs font-medium text-blue-600">Learning</div>
          <div className="mt-1 text-2xl font-bold text-blue-700">
            {stats.masteryCounts.learning}
          </div>
          <div className="mt-1 text-[11px] text-blue-600">
            cards in progress
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-medium text-amber-700">Due now</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {stats.overdueCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-700">reviews</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="text-xs font-medium text-indigo-700">
            Days studied · last 7
          </div>
          <div className="mt-1 text-2xl font-bold text-indigo-700">
            {stats.daysStudied7} / 7
          </div>
          <div className="mt-1 text-[11px] text-indigo-600">
            days · {stats.reviews7} review
            {stats.reviews7 === 1 ? "" : "s"}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs font-medium text-emerald-700">
            Days studied · last 30
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {stats.daysStudied30} / 30
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">
            days with a review
          </div>
        </div>
      </div>
    </>
  );
}

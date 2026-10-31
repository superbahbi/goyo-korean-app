import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Target } from "lucide-react";
import {
  MASTERY_LABELS,
  MASTERY_STYLES,
  type MasteryState,
} from "@/lib/mastery";
import type { ForecastDay } from "@/lib/queue";

export interface CategoryMastery {
  id: string;
  name: string;
  icon: string;
  reviewed: number;
  total: number;
  accuracy: number | null;
}

export interface StatsForecastDay extends ForecastDay {
  label: string;
}

export interface StatsDialogStats {
  level: number;
  totalXp: number;
  nextLevelXp: number;
  streak: number;
  levelTitle: string;
  levelProgress: number;
  totalReviews: number;
  overallAccuracy: number;
  masteredCount: number;
  medianResponseTime: number | null;
  overdueCount: number;
  daysStudied7: number;
  daysStudied30: number;
  reviews7: number;
  masteryCounts: Record<MasteryState, number>;
  categories: CategoryMastery[];
}

export interface StatsDialogForecast {
  days: StatsForecastDay[];
  total: number;
  peak: StatsForecastDay;
}

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
  const forecastSummary =
    forecast.peak.count > 0
      ? `30-day review forecast: ${forecast.total} review${forecast.total === 1 ? "" : "s"}, peak ${forecast.peak.count} on ${forecast.peak.label}`
      : "30-day review forecast: no scheduled reviews";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Target size={20} className="text-emerald-600" /> Your Korean
            ability
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Progress measured by recall, coverage, and durable review—not just
            completion.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-100">
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
          <div className="mt-2 flex justify-between text-xs text-emerald-100">
            <span>{stats.totalXp} XP earned</span>
            <span>
              {Math.max(0, stats.nextLevelXp - stats.totalXp)} XP to next level
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="text-xs text-yellow-600 font-medium">Total XP</div>
            <div className="text-3xl font-bold text-yellow-700">
              {stats.totalXp}
            </div>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="text-xs font-medium text-orange-600">Streak</div>
            <div className="text-3xl font-bold text-orange-700">
              {stats.streak}d
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-xs font-medium text-indigo-600">Recall</div>
            <div className="text-3xl font-bold text-indigo-700">
              {stats.overallAccuracy}%
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-medium text-emerald-600">Known</div>
            <div className="text-3xl font-bold text-emerald-700">
              {stats.masteredCount}
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="text-xs font-medium text-cyan-600">
              Recall tempo
            </div>
            <div className="text-3xl font-bold text-cyan-700">
              {stats.medianResponseTime
                ? `${Math.round(stats.medianResponseTime / 1000)}s`
                : "—"}
            </div>
            <div className="mt-1 text-[11px] text-cyan-600">
              median response
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium text-slate-500">Reviews</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {stats.totalReviews}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              total attempts
            </div>
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
            <div className="text-xs font-medium text-amber-600">Due now</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">
              {stats.overdueCount}
            </div>
            <div className="mt-1 text-[11px] text-amber-600">reviews</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            <div className="text-xs font-medium text-indigo-600">
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
            <div className="text-xs font-medium text-emerald-600">
              Days studied · last 30
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">
              {stats.daysStudied30} / 30
            </div>
            <div className="mt-1 text-[11px] text-emerald-600">
              days with a review
            </div>
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Ability states</h3>
            <span className="text-xs text-slate-500">
              Based on spaced recall
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["new", "learning", "shaky", "known"] as MasteryState[]).map(
              mastery => (
                <div
                  key={mastery}
                  className={`rounded-xl p-3 ${MASTERY_STYLES[mastery]}`}
                >
                  <div className="text-xs font-semibold">
                    {MASTERY_LABELS[mastery]}
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    {stats.masteryCounts[mastery]}
                  </div>
                  <div className="text-[11px] opacity-75">cards</div>
                </div>
              )
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Known means at least three reviews with 75%+ recall and a review
            interval of seven days or more.
          </p>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Category mastery</h3>
            <span className="text-xs text-slate-500">Accuracy · coverage</span>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {stats.categories.map(category => (
              <div
                key={category.id}
                className="rounded-xl border border-slate-100 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true">{category.icon}</span>
                    <span className="truncate text-sm font-medium text-slate-700">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {category.accuracy === null
                      ? "Not started"
                      : `${category.accuracy}% · ${category.reviewed}/${category.total}`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${category.accuracy === null ? "bg-slate-200" : category.accuracy >= 80 ? "bg-emerald-500" : category.accuracy >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${category.accuracy ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800">
                30-day review outlook
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Scheduled cards only; new cards are not included.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {forecast.total} reviews
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-[11px] font-medium text-slate-500">
                Average / day
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {(forecast.total / 30).toFixed(1)}
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <div className="text-[11px] font-medium text-amber-600">
                Peak day
              </div>
              <div className="mt-1 text-xl font-bold text-amber-700">
                {forecast.peak.count}
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 sm:col-span-1">
              <div className="text-[11px] font-medium text-indigo-600">
                Peak date
              </div>
              <div className="mt-1 text-xl font-bold text-indigo-700">
                {forecast.peak.count > 0 ? forecast.peak.label : "No reviews"}
              </div>
            </div>
          </div>
          <div
            className="mt-4 overflow-x-auto pb-1"
            role="img"
            aria-label={forecastSummary}
          >
            <div className="flex min-w-[720px] items-end gap-1">
              {forecast.days.map(day => {
                const height =
                  forecast.peak.count > 0
                    ? Math.max(
                        8,
                        Math.round((day.count / forecast.peak.count) * 64)
                      )
                    : 8;
                return (
                  <div
                    key={day.key}
                    className="flex w-5 shrink-0 flex-col items-center gap-1"
                    title={`${day.label}: ${day.count} review${day.count === 1 ? "" : "s"}`}
                  >
                    <div className="flex h-16 items-end">
                      <div
                        className={`w-3 rounded-t-full ${day.count === forecast.peak.count && day.count > 0 ? "bg-amber-400" : day.count > 0 ? "bg-emerald-400" : "bg-slate-100"}`}
                        style={{ height }}
                      />
                    </div>
                    {(day.key === today ||
                      day.key === forecast.days[7]?.key ||
                      day.key === forecast.days[14]?.key ||
                      day.key === forecast.days[21]?.key) && (
                      <span className="text-[9px] text-slate-500">
                        {day.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

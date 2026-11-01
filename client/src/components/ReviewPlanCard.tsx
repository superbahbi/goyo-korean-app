import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import type { ForecastDay, WorkloadStatus } from "@/lib/queue";

export interface ReviewForecastDay extends ForecastDay {
  label: string;
}

interface ReviewPlanCardProps {
  today: string;
  overdueCount: number;
  nextScheduledReview: string | null | undefined;
  forecast: ReviewForecastDay[];
  forecastPeak: ReviewForecastDay;
  workloadStatus: WorkloadStatus;
}

/** Seven-day review forecast with the workload summary. */
export function ReviewPlanCard({
  today,
  overdueCount,
  nextScheduledReview,
  forecast,
  forecastPeak,
  workloadStatus,
}: ReviewPlanCardProps) {
  const hasHistory = forecastPeak.count > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="gap-0 overflow-hidden border-slate-100 bg-white py-0 shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg">
                <CalendarDays
                  size={18}
                  className="text-emerald-600"
                  aria-hidden="true"
                />
                Review Plan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {overdueCount > 0
                  ? `${overdueCount} card${overdueCount === 1 ? " is" : "s are"} ready for review today.`
                  : nextScheduledReview
                    ? `Your next scheduled review is ${new Date(`${nextScheduledReview}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
                    : "Complete a session to build your review plan."}
              </p>
            </div>
            <Badge
              className={
                overdueCount > 0
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  : hasHistory
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
              }
            >
              {overdueCount > 0
                ? "Focus today"
                : hasHistory
                  ? "On track"
                  : "Not started"}
            </Badge>
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Scheduled reviews · next 7 days
          </p>
          <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
            {forecast.map(day => {
              const isToday = day.key === today;
              const intensity =
                day.count === 0
                  ? "bg-slate-100 text-slate-600"
                  : day.count <= 2
                    ? "bg-emerald-100 text-emerald-700"
                    : day.count <= 5
                      ? "bg-amber-100 text-amber-700"
                      : "bg-orange-200 text-orange-800";
              return (
                <div key={day.key} className="text-center">
                  <div
                    className={`mb-1 truncate text-[10px] font-semibold ${isToday ? "text-emerald-700" : "text-slate-600"}`}
                  >
                    {day.label}
                  </div>
                  <div
                    className={`flex h-9 items-center justify-center rounded-xl text-sm font-bold ${intensity} ${isToday ? "ring-2 ring-emerald-300 ring-offset-1" : ""}`}
                  >
                    {day.count}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed ${
              !hasHistory
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : workloadStatus === "heavy"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : workloadStatus === "busy"
                    ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
            role="status"
          >
            {!hasHistory ? (
              "Your plan starts with your first session. New cards are introduced gradually from here."
            ) : (
              <>
                <span className="font-semibold">
                  {workloadStatus === "heavy"
                    ? "Plan a lighter week."
                    : workloadStatus === "busy"
                      ? "A busier review day is coming."
                      : "Your review load is balanced."}
                </span>{" "}
                The peak is {forecastPeak.count} scheduled review
                {forecastPeak.count === 1 ? "" : "s"} on {forecastPeak.label}.
                Short, consistent sessions will keep it manageable.
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Play } from "lucide-react";
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
  onStartSession: () => void;
}

/** Seven-day review forecast with the workload summary. */
export function ReviewPlanCard({
  today,
  overdueCount,
  nextScheduledReview,
  forecast,
  forecastPeak,
  workloadStatus,
  onStartSession,
}: ReviewPlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <CalendarDays size={18} className="text-emerald-600" />
                Review Plan
              </CardTitle>
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
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              }
            >
              {overdueCount > 0 ? "Focus today" : "On track"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                    className={`mb-1 text-[10px] font-semibold ${isToday ? "text-emerald-700" : "text-slate-600"}`}
                  >
                    {day.label}
                  </div>
                  <div
                    className={`flex h-10 items-center justify-center rounded-xl text-sm font-bold ${intensity} ${isToday ? "ring-2 ring-emerald-300 ring-offset-1" : ""}`}
                  >
                    {day.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Cards are scheduled automatically after each review.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={onStartSession}
            >
              <Play size={14} className="mr-2" />
              {overdueCount > 0 ? "Review due cards" : "Start a session"}
            </Button>
          </div>
          <div
            className={`mt-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${workloadStatus === "heavy" ? "border-amber-200 bg-amber-50 text-amber-800" : workloadStatus === "busy" ? "border-indigo-100 bg-indigo-50 text-indigo-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}
            role="status"
          >
            <span className="font-semibold">
              {workloadStatus === "heavy"
                ? "Plan a lighter week."
                : workloadStatus === "busy"
                  ? "A busier review day is coming."
                  : "Your review load is balanced."}
            </span>{" "}
            {forecastPeak.count > 0
              ? `The peak is ${forecastPeak.count} scheduled review${forecastPeak.count === 1 ? "" : "s"} on ${forecastPeak.label}. Short, consistent sessions will keep it manageable.`
              : "New cards will be introduced gradually as you build your review history."}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

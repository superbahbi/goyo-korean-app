import type { StatsDialogForecast } from "@/components/stats/types";

interface ForecastOutlookProps {
  forecast: StatsDialogForecast;
  today: string;
}

export function ForecastOutlook({ forecast, today }: ForecastOutlookProps) {
  const forecastSummary =
    forecast.peak.count > 0
      ? `30-day review forecast: ${forecast.total} review${forecast.total === 1 ? "" : "s"}, peak ${forecast.peak.count} on ${forecast.peak.label}`
      : "30-day review forecast: no scheduled reviews";

  return (
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
          <div className="text-[11px] font-medium text-amber-700">Peak day</div>
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
                  <span className="text-[9px] text-slate-500">{day.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import type { CardState } from "@/lib/mastery";
import type { VocabularyCard } from "@/lib/vocabulary";
import {
  buildReviewForecast,
  summarizeForecast,
  type ForecastDay,
  type WorkloadStatus,
} from "@/lib/queue";

/**
 * The dashboard review forecast: the next seven days with weekday labels, the
 * thirty-day forecast with month/day labels, and the workload summary derived
 * from it. Locale formatting is injected so this stays pure.
 */

/** A forecast day with its locale label resolved by the injected formatter. */
export interface LabeledForecastDay extends ForecastDay {
  label: string;
}

export type StatsForecastDay = LabeledForecastDay;

export type ForecastLabelStyle = "weekday" | "monthDay";

export interface DashboardForecast {
  forecast: LabeledForecastDay[];
  extendedForecast: LabeledForecastDay[];
  total: number;
  peak: LabeledForecastDay;
  status: WorkloadStatus;
}

export interface DashboardForecastInput {
  studyReady: VocabularyCard[];
  cardStates: Record<string, CardState>;
  today: string;
  dailyGoal: number;
  labelDate: (key: string, style: ForecastLabelStyle) => string;
}

export function buildDashboardForecast({
  studyReady,
  cardStates,
  today,
  dailyGoal,
  labelDate,
}: DashboardForecastInput): DashboardForecast {
  const forecast = buildReviewForecast(studyReady, cardStates, today, 7, {
    overdueOnFirstDay: true,
  }).map((day, offset) => ({
    ...day,
    label:
      offset === 0
        ? "Today"
        : offset === 1
          ? "Tmrw"
          : labelDate(day.key, "weekday"),
  }));

  const extendedForecast = buildReviewForecast(
    studyReady,
    cardStates,
    today,
    30
  ).map(day => ({
    ...day,
    label: labelDate(day.key, "monthDay"),
  }));

  const { total, peak, status } = summarizeForecast(
    extendedForecast,
    dailyGoal
  );

  return { forecast, extendedForecast, total, peak, status };
}

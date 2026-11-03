/**
 * The stats dialog consumes the dashboard view model's payload types. Keeping
 * these aliases here means the dialog's imports stay local while there is only
 * one definition of the category and forecast shapes.
 */
export type { CategorySummary as CategoryMastery } from "@/lib/dashboardStats";
export type { StatsForecastDay } from "@/lib/dashboardForecast";
export type {
  StatsDialogForecast,
  StatsDialogStats,
} from "@/lib/dashboardView";

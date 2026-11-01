import type { MasteryState } from "@/lib/mastery";
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

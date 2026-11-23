# client/src/components/stats/

## Responsibility

Presentational breakdown panels for the Stats dialog: summary tiles, 30-day
review forecast, mastery-state counts, and per-category mastery. Every number
arrives precomputed in the dashboard view model, so this folder formats and
lays out values and performs no aggregation, scheduling, or storage access.
`types.ts` is the local type seam that gives the dialog one import surface.

## Design

- **Alias-only type module.** `types.ts` re-exports view-model shapes without
  redefining them: `CategorySummary as CategoryMastery` from
  `@/lib/dashboardStats`, `StatsForecastDay` from `@/lib/dashboardForecast`,
  and `StatsDialogForecast` plus `StatsDialogStats` from
  `@/lib/dashboardView`. The dialog can import locally while a single
  definition remains authoritative.
- **Pure presentational components.** Each named export takes a narrow prop and
  holds no state: `StatsSummaryTiles({ stats })`,
  `ForecastOutlook({ forecast, today })`,
  `MasteryBreakdown({ masteryCounts })`,
  `CategoryMasteryList({ categories })`.
- **Token-driven visuals.** Tailwind utility classes plus the shared
  `MASTERY_LABELS`/`MASTERY_STYLES` maps from `@/lib/mastery` keep the four
  Ability states consistent; accuracy bars threshold at 80% and 60%.
- **Accessible derived summaries.** `ForecastOutlook` renders the bar chart as
  `role="img"` with a generated sentence (total reviews, peak count and label).
  `CategoryMasteryList` exposes a labelled, keyboard-focusable scroll group
  and shows "Not started" when `accuracy` is `null`.

## Flow

`StatsDialog` receives `stats` (`StatsDialogStats`) and `forecast`
(`StatsDialogForecast`) plus `today` (a day key). It passes them down unchanged.
`StatsSummaryTiles` reads totals, streak, overall accuracy, mastered and
overdue counts, median response time, and 7/30-day study counts.
`ForecastOutlook` derives per-day bar heights from `day.count / peak.count`
(8px minimum), labels only today and weekly ticks, and calls out the peak day.
`MasteryBreakdown` iterates the fixed order `new → learning → shaky → known`
over `masteryCounts`. `CategoryMasteryList` renders one bar per category from
`accuracy`, `reviewed`, and `total`. No component writes data back.

## Integration

Imports types from `@/components/stats/types`, `@/lib/mastery`, and (through
that seam) `@/lib/dashboardStats`, `@/lib/dashboardForecast`, and
`@/lib/dashboardView`.

Consumers: `../StatsDialog.tsx` renders all four and re-exports
`CategoryMastery`, `StatsDialogForecast`, `StatsDialogStats`, and
`StatsForecastDay`; `../dialogs/registry.tsx` lazily mounts `StatsDialog` from
a Dialog request. Cross-references: `../dialogs`, `../../lib/dashboardView`,
`../../lib/dashboardStats`, `../../lib/dashboardForecast`, `../../lib/mastery`.

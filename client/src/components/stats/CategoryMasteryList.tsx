import type { CategoryMastery } from "@/components/stats/types";

interface CategoryMasteryListProps {
  categories: CategoryMastery[];
}

export function CategoryMasteryList({ categories }: CategoryMasteryListProps) {
  return (
    <div className="mt-5 border-t border-border/70 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground/90">Category mastery</h3>
        <span className="text-xs text-muted-foreground">
          Accuracy · coverage
        </span>
      </div>
      <div
        role="group"
        aria-label="Category mastery by category"
        tabIndex={0}
        className="max-h-56 space-y-2 overflow-y-auto rounded-lg pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        {categories.map(category => (
          <div
            key={category.id}
            className="rounded-xl border border-border/70 bg-card p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true">{category.icon}</span>
                <span className="truncate text-sm font-medium text-foreground/80">
                  {category.name}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {category.accuracy === null
                  ? "Not started"
                  : `${category.accuracy}% · ${category.reviewed}/${category.total}`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${category.accuracy === null ? "bg-muted" : category.accuracy >= 80 ? "bg-emerald-500" : category.accuracy >= 60 ? "bg-amber-400 dark:bg-amber-700" : "bg-red-400 dark:bg-red-700"}`}
                style={{ width: `${category.accuracy ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

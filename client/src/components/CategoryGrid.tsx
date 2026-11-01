import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";

interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  reviewed: number;
  total: number;
  known: number;
  coverage: number;
}

interface CategoryGridProps {
  categories: CategorySummary[];
  vocabularyCount: number;
  onViewAll: () => void;
  onSelectCategory: (categoryId: string) => void;
}

const COLLAPSED_THEMES = 6;

/**
 * Theme cards that deep-link into the browse dialog. The grid starts collapsed
 * so the dashboard stays short; themes already in progress come first.
 */
export function CategoryGrid({
  categories,
  vocabularyCount,
  onViewAll,
  onSelectCategory,
}: CategoryGridProps) {
  const [showAll, setShowAll] = useState(false);

  const ordered = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.reviewed === 0 && b.reviewed > 0) return 1;
        if (b.reviewed === 0 && a.reviewed > 0) return -1;
        return b.reviewed - a.reviewed;
      }),
    [categories]
  );

  const visible = showAll ? ordered : ordered.slice(0, COLLAPSED_THEMES);
  const canExpand = categories.length > COLLAPSED_THEMES;

  return (
    <section className="space-y-3" aria-labelledby="categories-heading">
      <SectionHeading
        id="categories-heading"
        eyebrow="Your library"
        title="Learn by theme"
        action={
          <button
            type="button"
            className="rounded text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            onClick={onViewAll}
          >
            View all {vocabularyCount}
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {visible.map(category => (
          <button
            type="button"
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="group rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-4"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${category.color}`}
                aria-hidden="true"
              >
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-foreground/90 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {category.name}
                </h3>
                <p className="truncate text-[11px] text-muted-foreground">
                  {category.total} cards
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {category.coverage}%
              </span>
            </div>
            <div
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${category.coverage}%` }}
              />
            </div>
            <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
              {category.reviewed > 0
                ? `${category.known} known · ${category.reviewed} reviewed`
                : "Not started yet"}
            </p>
          </button>
        ))}
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setShowAll(current => !current)}
          aria-expanded={showAll}
          className="mx-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-foreground/70 hover:text-emerald-700 dark:hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {showAll ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
          {showAll
            ? "Show fewer themes"
            : `Show all ${categories.length} themes`}
        </button>
      )}
    </section>
  );
}

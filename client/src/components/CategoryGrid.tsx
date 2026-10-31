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

/** Theme cards that deep-link into the browse dialog. */
export function CategoryGrid({
  categories,
  vocabularyCount,
  onViewAll,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <section className="space-y-4" aria-labelledby="categories-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Your library
          </p>
          <h2
            id="categories-heading"
            className="mt-1 font-serif text-2xl text-slate-900"
          >
            Learn by theme
          </h2>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          onClick={onViewAll}
        >
          View all {vocabularyCount}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => (
          <button
            type="button"
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${category.color}`}
                  aria-hidden="true"
                >
                  {category.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700">
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {category.total} cards
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                {category.coverage}%
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${category.coverage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {category.known} known · {category.reviewed} reviewed
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

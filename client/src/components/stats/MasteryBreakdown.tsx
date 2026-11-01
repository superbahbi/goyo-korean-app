import {
  MASTERY_LABELS,
  MASTERY_STYLES,
  type MasteryState,
} from "@/lib/mastery";

interface MasteryBreakdownProps {
  masteryCounts: Record<MasteryState, number>;
}

export function MasteryBreakdown({ masteryCounts }: MasteryBreakdownProps) {
  return (
    <div className="mt-5 border-t border-border/70 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground/90">Ability states</h3>
        <span className="text-xs text-muted-foreground">
          Based on spaced recall
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["new", "learning", "shaky", "known"] as MasteryState[]).map(
          mastery => (
            <div
              key={mastery}
              className={`rounded-xl p-3 ${MASTERY_STYLES[mastery]}`}
            >
              <div className="text-xs font-semibold">
                {MASTERY_LABELS[mastery]}
              </div>
              <div className="mt-1 text-2xl font-bold">
                {masteryCounts[mastery]}
              </div>
              <div className="text-[11px]">cards</div>
            </div>
          )
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Known means at least three reviews with 75%+ recall and a review
        interval of seven days or more.
      </p>
    </div>
  );
}

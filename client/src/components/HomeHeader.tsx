import { Button } from "@/components/ui/button";
import { Flame, Settings, Star } from "lucide-react";

interface HomeHeaderProps {
  streak: number;
  totalXp: number;
  onOpenSettings: () => void;
}

/**
 * Sticky dashboard header. Level lives in the stat strip below the hero so the
 * header stays a compact brand/streak/XP bar on every screen size.
 */
export function HomeHeader({
  streak,
  totalXp,
  onOpenSettings,
}: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-sm shadow-slate-200/30 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-200/70 sm:h-11 sm:w-11 sm:text-xl"
            aria-hidden="true"
            lang="ko"
          >
            고요
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
              Goyo
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              Scientific Korean practice
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            className="flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50 px-2.5 py-2 sm:px-3"
            title="Current streak"
          >
            <Flame
              size={17}
              className="text-orange-500"
              fill="currentColor"
              aria-hidden="true"
            />
            {streak > 0 ? (
              <>
                <span className="text-sm font-bold text-orange-700">
                  {streak}
                </span>
                <span className="hidden text-xs text-orange-700 sm:inline">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-orange-700">
                Start a streak
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl border border-yellow-100 bg-yellow-50 px-2.5 py-2 sm:px-3"
            title="Total XP"
          >
            <Star
              size={17}
              className="text-yellow-500"
              fill="currentColor"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-yellow-700">{totalXp}</span>
            <span className="hidden text-xs text-yellow-700 sm:inline">XP</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="ml-0.5 h-10 w-10 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}

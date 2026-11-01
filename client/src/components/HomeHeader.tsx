import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 shadow-sm shadow-black/5 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between gap-3 px-4 sm:h-[76px] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-200/70 dark:shadow-black/40 sm:h-11 sm:w-11 sm:text-xl"
            aria-hidden="true"
            lang="ko"
          >
            고요
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              Goyo
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Scientific Korean practice
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div
            className="flex items-center gap-1.5 rounded-xl border border-orange-100 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-2 sm:px-3"
            title="Current streak"
          >
            <Flame
              size={17}
              className="text-orange-500 dark:text-orange-400"
              fill="currentColor"
              aria-hidden="true"
            />
            {streak > 0 ? (
              <>
                <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                  {streak}
                </span>
                <span className="hidden text-xs text-orange-700 dark:text-orange-300 sm:inline">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                Start a streak
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl border border-yellow-100 dark:border-yellow-900/60 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-2 sm:px-3"
            title="Total XP"
          >
            <Star
              size={17}
              className="text-yellow-500 dark:text-yellow-400"
              fill="currentColor"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
              {totalXp}
            </span>
            <span className="hidden text-xs text-yellow-700 dark:text-yellow-300 sm:inline">
              XP
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="ml-0.5 h-10 w-10 rounded-xl border-border bg-card text-foreground/70 hover:bg-muted/60 hover:text-emerald-700 dark:hover:text-emerald-300"
            onClick={onOpenSettings}
            aria-label="Open settings"
          >
            <Settings size={18} />
          </Button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

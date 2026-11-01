import { Button } from "@/components/ui/button";
import { Flame, Settings, Star } from "lucide-react";

interface HomeHeaderProps {
  level: number;
  levelTitle: string;
  levelProgress: number;
  streak: number;
  totalXp: number;
  onOpenSettings: () => void;
}

/** Sticky dashboard header: brand, level, streak, XP, and settings entry. */
export function HomeHeader({
  level,
  levelTitle,
  levelProgress,
  streak,
  totalXp,
  onOpenSettings,
}: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-sm shadow-slate-200/30 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-md shadow-emerald-200/70"
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
          <div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 sm:flex">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-center text-[10px] font-bold leading-7 text-indigo-700">
              L{level}
            </div>
            <div className="w-20">
              <div className="flex items-center justify-between text-[10px] font-semibold text-indigo-700">
                <span>{levelTitle}</span>
                <span>{Math.round(levelProgress)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>
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
            <span className="text-sm font-bold text-orange-700">{streak}</span>
            <span className="hidden text-xs text-orange-700 sm:inline">
              day streak
            </span>
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

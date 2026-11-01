import { Button } from "@/components/ui/button";
import { Check, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IntervalPreview, SrsRating } from "@/lib/srs";

interface GradeActionsProps {
  /** Next interval, in days, for each rating of the current card. */
  intervals: IntervalPreview;
  onGrade: (rating: SrsRating) => void;
}

const GRADES = [
  {
    rating: "again",
    label: "Again",
    icon: X,
    className:
      "border-red-100 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40",
  },
  {
    rating: "good",
    label: "Good",
    icon: Check,
    className:
      "border-emerald-100 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
  },
  {
    rating: "easy",
    label: "Easy",
    icon: Star,
    className:
      "border-blue-100 text-blue-700 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/40",
  },
] as const;

function daysLabel(days: number) {
  return `${days}d`;
}

function daysDescription(days: number) {
  return days === 1 ? "1 day" : `${days} days`;
}

/**
 * The three recall ratings, compact enough to sit under a full card on a phone.
 * Each button names the real interval the scheduler would save, so the learner
 * chooses with the outcome in view instead of guessing.
 */
export function GradeActions({ intervals, onGrade }: GradeActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {GRADES.map(({ rating, label, icon: Icon, className }, position) => {
        const days = intervals[rating];
        return (
          <motion.div
            key={rating}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + position * 0.05 }}
          >
            <Button
              variant="outline"
              className={cn(
                "h-14 w-full flex-col gap-0.5 rounded-2xl border-2 px-2 py-1 sm:h-16",
                className
              )}
              onClick={() => onGrade(rating)}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold sm:text-base">
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
              <span className="text-[11px] font-normal opacity-80 sm:text-xs">
                {daysLabel(days)}
              </span>
              <span className="sr-only">
                , next review in {daysDescription(days)}
              </span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

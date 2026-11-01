import { Card } from "@/components/ui/card";
import { Play, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeCardProps {
  cardsRemaining: number;
  plannedCards: number;
  newCards: number;
  overdueCount: number;
  dailyGoalReached: boolean;
  onStartSession: () => void;
}

/** Hero card that explains today's plan and starts the daily session. */
export function WelcomeCard({
  cardsRemaining,
  plannedCards,
  newCards,
  overdueCount,
  dailyGoalReached,
  onStartSession,
}: WelcomeCardProps) {
  const summary =
    cardsRemaining > 0
      ? plannedCards > 0
        ? `${overdueCount > 0 ? `${overdueCount} review${overdueCount === 1 ? "" : "s"} due · ` : ""}${plannedCards} card${plannedCards === 1 ? "" : "s"} planned for today`
        : "Today's scheduled reviews are complete. New words resume tomorrow."
      : "You've hit today's goal. Extra practice is optional from here.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden gap-0 border-none bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 py-0 text-white shadow-xl shadow-emerald-900/10">
        <div
          className="pointer-events-none absolute -right-6 -top-8 opacity-10"
          aria-hidden="true"
        >
          {dailyGoalReached ? <Trophy size={180} /> : <Sparkles size={180} />}
        </div>
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Today&apos;s plan
            </p>
            <h2 className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">
              {dailyGoalReached ? "Daily goal complete" : "Ready to practice?"}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-emerald-50/90">
              {summary}
            </p>
            {overdueCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-white">
                  {overdueCount} due now
                </span>
                {newCards > 0 && (
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-white">
                    {newCards} new
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="relative z-10 flex h-12 w-full shrink-0 touch-manipulation items-center justify-center rounded-xl bg-white px-6 text-base font-bold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.99] sm:h-14 sm:w-auto sm:min-w-[15rem] sm:text-lg"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              onStartSession();
            }}
            aria-label={
              dailyGoalReached ? "Review what you know" : "Start daily session"
            }
          >
            <Play
              className="pointer-events-none mr-2 fill-current"
              size={20}
              aria-hidden="true"
            />
            <span className="pointer-events-none">
              {dailyGoalReached
                ? "Review What You Know"
                : "Start Daily Session"}
            </span>
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

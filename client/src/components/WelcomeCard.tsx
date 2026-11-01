import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeCardProps {
  cardsRemaining: number;
  plannedCards: number;
  overduePrefix: string;
  dailyGoalReached: boolean;
  onStartSession: () => void;
}

/** Hero card that explains today's plan and starts the daily session. */
export function WelcomeCard({
  cardsRemaining,
  plannedCards,
  overduePrefix,
  dailyGoalReached,
  onStartSession,
}: WelcomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-10">
          <Trophy size={140} />
        </div>
        <CardHeader>
          <CardTitle className="text-3xl font-serif">
            Ready to practice?
          </CardTitle>
          <p className="text-emerald-50 opacity-90 mt-2">
            {cardsRemaining > 0
              ? plannedCards > 0
                ? `${overduePrefix}${plannedCards} cards planned for today`
                : `${overduePrefix}Today's scheduled reviews are complete. New words resume tomorrow.`
              : "Daily goal complete! Review your Korean or come back tomorrow."}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <button
            type="button"
            className="relative z-10 flex h-14 w-full touch-manipulation items-center justify-center rounded-lg bg-white px-6 text-lg font-bold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.99]"
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

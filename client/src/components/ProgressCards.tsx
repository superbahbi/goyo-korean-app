import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressCardsProps {
  cardsStudiedToday: number;
  dailyGoal: number;
  newCardsPerDay: number;
  progressPercent: number;
  level: number;
  levelTitle: string;
  levelProgress: number;
  totalXp: number;
  nextLevelXp: number;
  totalCardsLearned: number;
  studyReadyCount: number;
}

/** Today's progress, level progress, and total learned cards. */
export function ProgressCards({
  cardsStudiedToday,
  dailyGoal,
  newCardsPerDay,
  progressPercent,
  level,
  levelTitle,
  levelProgress,
  totalXp,
  nextLevelXp,
  totalCardsLearned,
  studyReadyCount,
}: ProgressCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <BookOpen size={16} />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {cardsStudiedToday}/{dailyGoal}
            </div>
            <Progress
              value={progressPercent}
              aria-label="Today's cards studied"
              className="h-2 mt-3 bg-slate-100"
            />
            <p className="text-xs text-slate-500 mt-2">
              Cards studied today · up to {newCardsPerDay} new{" "}
              {newCardsPerDay === 1 ? "word" : "words"} per day
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <Zap size={16} />
              Level {level}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl font-bold text-slate-900">
                {levelTitle}
              </div>
              <div className="text-sm font-semibold text-emerald-700">
                Lv. {level}
              </div>
            </div>
            <Progress
              value={levelProgress}
              aria-label={`Level ${level} progress`}
              className="mt-3 h-2 bg-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500">
              {Math.max(0, nextLevelXp - totalXp)} XP to next level
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <TrendingUp size={16} />
              Total Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {totalCardsLearned}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {Math.round((totalCardsLearned / studyReadyCount) * 100)}% of
              study-ready deck
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

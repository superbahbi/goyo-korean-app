import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, CalendarDays, Flame, Star, Trophy, Play, BookOpen, BarChart2, Settings, TrendingUp, Zap, Volume2, Eye, EyeOff, Headphones, MapPin, Search, Target } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getLocalDateKey, getMasteryState, useStudyState, type MasteryState } from "@/hooks/useStudyState";
import { StudySession } from "@/components/StudySession";
import { VOCABULARY_DATA, STUDY_READY_VOCABULARY, CATEGORIES } from "@/lib/vocabulary";
import { AlphabetPractice } from "./AlphabetPractice";
import { ListeningPractice } from "@/components/ListeningPractice";
import { ScenarioPractice } from "@/components/ScenarioPractice";
import { ShadowingPractice } from "@/components/ShadowingPractice";
import { playVocabularyAudio, stopAudio, setAudioSpeaker, type AudioSpeaker } from "@/lib/audioPlayer";

const BROWSE_PAGE_SIZE = 40;

export default function Home() {
  const { state, gradeCard, updateSettings } = useStudyState();
  const [queue, setQueue] = useState<typeof VOCABULARY_DATA>([]);
  const [sessionQueue, setSessionQueue] = useState<typeof VOCABULARY_DATA>([]);
  const [sessionMode, setSessionMode] = useState<"daily" | "weak" | "learning">("daily");
  const [isStudying, setIsStudying] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlphabet, setShowAlphabet] = useState(false);
  const [showListening, setShowListening] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showShadowing, setShowShadowing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseMastery, setBrowseMastery] = useState<MasteryState | "all">("all");
  const [browseVisibleCount, setBrowseVisibleCount] = useState(BROWSE_PAGE_SIZE);
  const [showRomanization, setShowRomanization] = useState<Record<string, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);

  useEffect(() => {
    if (state?.settings.audioSpeaker) setAudioSpeaker(state.settings.audioSpeaker);
  }, [state?.settings.audioSpeaker]);

  useEffect(() => {
    setBrowseVisibleCount(BROWSE_PAGE_SIZE);
  }, [browseQuery, browseMastery, selectedCategory]);

  const handleSpeakerChange = (speaker: AudioSpeaker) => {
    updateSettings({ audioSpeaker: speaker });
    setAudioSpeaker(speaker);
    toast.success("Speaker preference saved");
  };

  const handleDailyGoalChange = (value: string) => {
    const dailyGoal = Number(value);
    if (!Number.isFinite(dailyGoal) || dailyGoal < 1) return;
    updateSettings({ dailyGoal });
    toast.success(`Daily goal set to ${dailyGoal} cards`);
  };

  const speakKorean = async (wordId: string, fallbackText?: string) => {
    setIsSpeaking(true);
    setPlayingCardId(wordId);
    try {
      await playVocabularyAudio(wordId, fallbackText);
    } finally {
      setIsSpeaking(false);
      setPlayingCardId(null);
    }
  };

  const getRomanization = (card: typeof VOCABULARY_DATA[0]) => {
    return card.romanization || "";
  };

  const masteryLabels: Record<MasteryState, string> = {
    new: "New",
    learning: "Learning",
    shaky: "Shaky",
    known: "Known",
  };
  const masteryStyles: Record<MasteryState, string> = {
    new: "bg-slate-100 text-slate-600",
    learning: "bg-blue-100 text-blue-700",
    shaky: "bg-amber-100 text-amber-700",
    known: "bg-emerald-100 text-emerald-700",
  };
  const masteryCounts = VOCABULARY_DATA.reduce<Record<MasteryState, number>>((counts, card) => {
    counts[getMasteryState(state?.cardStates[card.id])] += 1;
    return counts;
  }, { new: 0, learning: 0, shaky: 0, known: 0 });

  // Build queue of cards to study
  useEffect(() => {
    if (!state) return;

    const dailyGoal = state.settings.dailyGoal;
    const cardsStudiedToday = state.stats.cardsStudiedToday;
    
    const today = getLocalDateKey();

    // If daily goal is still in progress, review overdue cards first, then
    // introduce new cards to fill the remaining places in the session.
    if (cardsStudiedToday < dailyGoal) {
      const sessionSize = dailyGoal - cardsStudiedToday;
      const overdueCards = STUDY_READY_VOCABULARY
        .filter((card) => state.cardStates[card.id]?.due && state.cardStates[card.id].due <= today)
        .sort((a, b) => {
          const aDue = state.cardStates[a.id]?.due ?? today;
          const bDue = state.cardStates[b.id]?.due ?? today;
          return aDue.localeCompare(bDue);
        });
      const newCards = STUDY_READY_VOCABULARY.filter((card) => !state.cardStates[card.id]);
      const cardsToStudy = [...overdueCards, ...newCards]
        .filter((card, position, allCards) => allCards.findIndex((item) => item.id === card.id) === position)
        .slice(0, sessionSize);
      setQueue(cardsToStudy);
    } else {
      // Keep post-goal practice useful without turning the dashboard into a
      // full-deck session. Prioritize due cards, then the learner's weakest
      // reviewed cards, and finally a small set of new cards.
      const dueCards = STUDY_READY_VOCABULARY.filter((card) => {
        const due = state.cardStates[card.id]?.due;
        return Boolean(due && due <= today);
      });
      const fallbackCards = STUDY_READY_VOCABULARY
        .filter((card) => !dueCards.some((dueCard) => dueCard.id === card.id))
        .sort((a, b) => {
          const aState = state.cardStates[a.id];
          const bState = state.cardStates[b.id];
          const aAccuracy = (aState?.timesCorrect ?? 0) / (aState?.timesReviewed ?? 1);
          const bAccuracy = (bState?.timesCorrect ?? 0) / (bState?.timesReviewed ?? 1);
          return aAccuracy - bAccuracy;
        });
      setQueue([...dueCards, ...fallbackCards].slice(0, dailyGoal));
    }
  }, [state?.cardStates, state?.stats.cardsStudiedToday, state?.settings.dailyGoal]);

  const handleGrade = (cardId: string, rating: "again" | "good" | "easy") => {
    const isRepeatPractice = sessionMode === "daily" && dailyGoalReached;
    const wasBelowGoal = Boolean(state && !isRepeatPractice && state.stats.cardsStudiedToday < state.settings.dailyGoal);
    gradeCard(cardId, rating, { countProgress: !isRepeatPractice });

    const xpGain = rating === "easy" ? 15 : rating === "good" ? 10 : 5;
    if (state && wasBelowGoal && state.stats.cardsStudiedToday + 1 >= state.settings.dailyGoal) {
      setTimeout(() => {
        toast.success("Daily goal reached! 🎉", {
          description: `You've earned ${xpGain} XP and maintained your streak!`,
        });
      }, 300);
    }
  };

  const startSession = () => {
    const availableCards = queue.length > 0 ? queue : STUDY_READY_VOCABULARY;
    if (availableCards.length === 0) {
      toast.info("No cards available to study today");
      return;
    }
    setSessionQueue([...availableCards]);
    setSessionMode("daily");
    setIsStudying(true);
  };

  const startWeakSession = () => {
    if (weakCards.length === 0) {
      toast.info("Review a few cards first to unlock Weak Words");
      return;
    }
    setSessionQueue(weakCards);
    setSessionMode("weak");
    setIsStudying(true);
  };

  const startLearningSession = () => {
    if (learningCards.length === 0) {
      toast.info("No Learning or Shaky cards yet", { description: "Start a Daily Session to build your review path." });
      return;
    }
    setSessionQueue(learningCards);
    setSessionMode("learning");
    setIsStudying(true);
  };

  const handleListeningGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating);
  };

  const handleScenarioGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating);
  };

  const handleShadowingGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating);
  };

  if (!state) return null;

  const cardsRemaining = Math.max(0, state.settings.dailyGoal - state.stats.cardsStudiedToday);
  const progressPercent = (state.stats.cardsStudiedToday / state.settings.dailyGoal) * 100;
  const dailyGoalReached = state.stats.cardsStudiedToday >= state.settings.dailyGoal;
  const levelTitles = ["Beginner", "Explorer", "Builder", "Conversational", "Fluent", "Korean Sage"];
  const levelTitle = levelTitles[Math.min(levelTitles.length - 1, Math.max(0, state.stats.level - 1))];
  const currentLevelXp = Math.pow(Math.max(0, state.stats.level - 1), 2) * 100;
  const nextLevelXp = Math.pow(state.stats.level, 2) * 100;
  const levelProgress = nextLevelXp > currentLevelXp
    ? Math.min(100, Math.max(0, ((state.stats.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))
    : 100;
  const today = getLocalDateKey();
  const overdueCount = STUDY_READY_VOCABULARY.filter((card) => {
    const due = state.cardStates[card.id]?.due;
    return Boolean(due && due <= today);
  }).length;
  const weakCards = STUDY_READY_VOCABULARY
    .filter((card) => Boolean(state.cardStates[card.id]?.timesReviewed))
    .sort((a, b) => {
      const aState = state.cardStates[a.id];
      const bState = state.cardStates[b.id];
      const aAccuracy = (aState?.timesCorrect ?? 0) / (aState?.timesReviewed ?? 1);
      const bAccuracy = (bState?.timesCorrect ?? 0) / (bState?.timesReviewed ?? 1);
      return aAccuracy - bAccuracy || (bState?.timesReviewed ?? 0) - (aState?.timesReviewed ?? 0);
    })
    .slice(0, 10);
  const learningCards = STUDY_READY_VOCABULARY
    .filter((card) => {
      const mastery = getMasteryState(state.cardStates[card.id]);
      return mastery === "learning" || mastery === "shaky";
    })
    .sort((a, b) => {
      const aState = state.cardStates[a.id];
      const bState = state.cardStates[b.id];
      return (aState?.due ?? "9999-12-31").localeCompare(bState?.due ?? "9999-12-31");
    })
    .slice(0, 10);
  const normalizedBrowseQuery = browseQuery.trim().toLocaleLowerCase();
  const filteredCards = VOCABULARY_DATA.filter((card) => {
    const matchesCategory = !selectedCategory || card.tag === selectedCategory;
    const matchesMastery = browseMastery === "all" || getMasteryState(state.cardStates[card.id]) === browseMastery;
    const matchesQuery = !normalizedBrowseQuery || [card.front, card.back, card.romanization, card.example].some((value) => value.toLocaleLowerCase().includes(normalizedBrowseQuery));
    return matchesCategory && matchesMastery && matchesQuery;
  });
  const visibleBrowseCards = filteredCards.slice(0, browseVisibleCount);
  const reviewedCards = VOCABULARY_DATA.filter((card) => Boolean(state.cardStates[card.id]?.timesReviewed));
  const totalReviews = reviewedCards.reduce((sum, card) => sum + (state.cardStates[card.id]?.timesReviewed ?? 0), 0);
  const totalCorrect = reviewedCards.reduce((sum, card) => sum + (state.cardStates[card.id]?.timesCorrect ?? 0), 0);
  const overallAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  const masteredCount = VOCABULARY_DATA.filter((card) => getMasteryState(state.cardStates[card.id]) === "known").length;
  const categoryMastery = CATEGORIES.map((category) => {
    const cards = VOCABULARY_DATA.filter((card) => card.tag === category.id);
    const reviewed = cards.filter((card) => Boolean(state.cardStates[card.id]?.timesReviewed));
    const reviews = reviewed.reduce((sum, card) => sum + (state.cardStates[card.id]?.timesReviewed ?? 0), 0);
    const correct = reviewed.reduce((sum, card) => sum + (state.cardStates[card.id]?.timesCorrect ?? 0), 0);
    return { ...category, reviewed: reviewed.length, total: cards.length, accuracy: reviews > 0 ? Math.round((correct / reviews) * 100) : null };
  });
  const reviewForecast = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const key = getLocalDateKey(date);
    return {
      key,
      label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString(undefined, { weekday: "short" }),
      count: STUDY_READY_VOCABULARY.filter((card) => {
        const due = state.cardStates[card.id]?.due;
        return offset === 0 ? Boolean(due && due <= key) : due === key;
      }).length,
    };
  });
  const nextScheduledReview = Object.values(state.cardStates)
    .map((card) => card.due)
    .filter((due) => due > today)
    .sort()[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-sm shadow-slate-200/30 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-md shadow-emerald-200/70" aria-hidden="true">
              고요
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">Goyo</h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block">Scientific Korean practice</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 sm:flex">
              <div className="h-7 w-7 rounded-lg bg-indigo-100 text-center text-[10px] font-bold leading-7 text-indigo-700">L{state.stats.level}</div>
              <div className="w-20">
                <div className="flex items-center justify-between text-[10px] font-semibold text-indigo-700">
                  <span>{levelTitle}</span>
                  <span>{Math.round(levelProgress)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-orange-100 bg-orange-50 px-2.5 py-2 sm:px-3" title="Current streak">
              <Flame size={17} className="text-orange-500" fill="currentColor" aria-hidden="true" />
              <span className="text-sm font-bold text-orange-600">{state.stats.streak}</span>
              <span className="hidden text-xs text-orange-500 sm:inline">day streak</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-yellow-100 bg-yellow-50 px-2.5 py-2 sm:px-3" title="Total XP">
              <Star size={17} className="text-yellow-500" fill="currentColor" aria-hidden="true" />
              <span className="text-sm font-bold text-yellow-600">{state.stats.totalXp}</span>
              <span className="hidden text-xs text-yellow-600 sm:inline">XP</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-0.5 h-10 w-10 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
            >
              <Settings size={18} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Card */}
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
              <CardTitle className="text-3xl font-serif">Ready to practice?</CardTitle>
              <p className="text-emerald-50 opacity-90 mt-2">
                {cardsRemaining > 0
                  ? `${overdueCount > 0 ? `${overdueCount} review${overdueCount === 1 ? "" : "s"} due · ` : ""}${cardsRemaining} cards left for today's goal`
                  : "Daily goal complete! Review your Korean or come back tomorrow."}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <button
                type="button"
                className="relative z-10 flex h-14 w-full touch-manipulation items-center justify-center rounded-lg bg-white px-6 text-lg font-bold text-emerald-600 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.99]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startSession();
                }}
                aria-label={dailyGoalReached ? "Review what you know" : "Start daily session"}
              >
                <Play className="pointer-events-none mr-2 fill-current" size={20} aria-hidden="true" />
                <span className="pointer-events-none">{dailyGoalReached ? "Review What You Know" : "Start Daily Session"}</span>
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
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
                  {state.stats.cardsStudiedToday}/{state.settings.dailyGoal}
                </div>
                <Progress value={progressPercent} className="h-2 mt-3 bg-slate-100" />
                <p className="text-xs text-slate-400 mt-2">Cards studied today</p>
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
                  Level {state.stats.level}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl font-bold text-slate-900">{levelTitle}</div>
                  <div className="text-sm font-semibold text-emerald-600">Lv. {state.stats.level}</div>
                </div>
                <Progress value={levelProgress} className="mt-3 h-2 bg-slate-100" />
                <p className="mt-2 text-xs text-slate-400">
                  {Math.max(0, nextLevelXp - state.stats.totalXp)} XP to next level
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
                  {state.stats.totalCardsLearned}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {Math.round((state.stats.totalCardsLearned / STUDY_READY_VOCABULARY.length) * 100)}% of study-ready deck
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Review Plan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="overflow-hidden border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <CalendarDays size={18} className="text-emerald-600" />
                    Review Plan
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {overdueCount > 0
                      ? `${overdueCount} card${overdueCount === 1 ? " is" : "s are"} ready for review today.`
                      : nextScheduledReview
                        ? `Your next scheduled review is ${new Date(`${nextScheduledReview}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
                        : "Complete a session to build your review plan."}
                  </p>
                </div>
                <Badge className={overdueCount > 0 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"}>
                  {overdueCount > 0 ? "Focus today" : "On track"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {reviewForecast.map((day) => {
                  const isToday = day.key === today;
                  const intensity = day.count === 0 ? "bg-slate-100 text-slate-400" : day.count <= 2 ? "bg-emerald-100 text-emerald-700" : day.count <= 5 ? "bg-amber-100 text-amber-700" : "bg-orange-200 text-orange-800";
                  return (
                    <div key={day.key} className="text-center">
                      <div className={`mb-1 text-[10px] font-semibold ${isToday ? "text-emerald-700" : "text-slate-400"}`}>{day.label}</div>
                      <div className={`flex h-10 items-center justify-center rounded-xl text-sm font-bold ${intensity} ${isToday ? "ring-2 ring-emerald-300 ring-offset-1" : ""}`}>
                        {day.count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">Cards are scheduled automatically after each review.</p>
                <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={startSession}>
                  <Play size={14} className="mr-2" />
                  {overdueCount > 0 ? "Review due cards" : "Start a session"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hangul Practice Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAlphabet(true)}
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-base hover:shadow-lg transition-all"
        >
          <div className="text-2xl mb-1">🔤</div>
          Learn Hangul (Korean Alphabet)
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowListening(true)}
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-base hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center gap-2 text-2xl mb-1"><Headphones size={25} /></div>
          Listening Practice
          <div className="text-xs font-normal text-slate-300 mt-1">10 audio-first questions · earn XP through recall</div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowScenarios(true)}
          className="mb-6 w-full rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg"
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl"><MapPin size={25} /></div>
          Survival Scenarios
          <div className="mt-1 text-xs font-normal text-rose-50">6 real-world situations · retrieve the phrase you would actually use</div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowShadowing(true)}
          className="mb-6 w-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg"
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl"><Headphones size={25} /></div>
          Shadowing Practice
          <div className="mt-1 text-xs font-normal text-indigo-50">8 phrases · match Korean rhythm and pronunciation aloud</div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startWeakSession}
          disabled={weakCards.length === 0}
          className="w-full mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl"><Brain size={25} /></div>
          Weak Words
          <div className="mt-1 text-xs font-normal text-amber-50">
            {weakCards.length > 0 ? `${weakCards.length} cards selected from your lowest recall` : "Review a few cards to unlock personalized training"}
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startLearningSession}
          className="mb-6 w-full rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          disabled={learningCards.length === 0}
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl"><BookOpen size={25} /></div>
          Learning Review
          <div className="mt-1 text-xs font-normal text-blue-50">
            {learningCards.length > 0 ? `${learningCards.length} Learning and Shaky cards need another pass` : "Cards will appear here as you begin reviewing"}
          </div>
        </motion.button>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setShowBrowse(true)}
          >
            <BookOpen className="mr-2" size={18} />
            Browse Deck
          </Button>
          <Button
            variant="outline"
            className="h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => setShowStats(true)}
          >
            <BarChart2 className="mr-2" size={18} />
            Full Stats
          </Button>
        </div>

        {/* Categories */}
        <section className="space-y-4" aria-labelledby="categories-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Your library</p>
              <h2 id="categories-heading" className="mt-1 font-serif text-2xl text-slate-900">Learn by theme</h2>
            </div>
            <button type="button" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => { setSelectedCategory(null); setBrowseMastery("all"); setShowBrowse(true); }}>
              View all {VOCABULARY_DATA.length}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const category = categoryMastery.find((item) => item.id === cat.id);
              const known = VOCABULARY_DATA.filter((card) => card.tag === cat.id && getMasteryState(state.cardStates[card.id]) === "known").length;
              const coverage = category?.total ? Math.round((known / category.total) * 100) : 0;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setBrowseMastery("all"); setBrowseQuery(""); setShowBrowse(true); }}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${cat.color}`} aria-hidden="true">{cat.icon}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700">{cat.name}</h3>
                        <p className="text-xs text-slate-400">{category?.total ?? 0} cards</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">{coverage}%</span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${coverage}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{known} known · {category?.reviewed ?? 0} reviewed</p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Study Session Modal */}
      {isStudying && sessionQueue.length > 0 && (
        <StudySession
          queue={sessionQueue}
          onGrade={handleGrade}
          onClose={() => {
            setIsStudying(false);
            setSessionQueue([]);
          }}
          allowRepeat={dailyGoalReached || sessionMode === "weak" || sessionMode === "learning"}
          title={sessionMode === "weak" ? "Weak Words" : sessionMode === "learning" ? "Learning Review" : "Daily Session"}
        />
      )}

      {/* Alphabet Practice Modal */}
      {showAlphabet && (
        <AlphabetPractice onClose={() => setShowAlphabet(false)} />
      )}

      {showListening && (
        <ListeningPractice
                  cards={STUDY_READY_VOCABULARY}
          onGrade={handleListeningGrade}
          onClose={() => setShowListening(false)}
        />
      )}

      {showScenarios && (
        <ScenarioPractice
          onGrade={handleScenarioGrade}
          onClose={() => setShowScenarios(false)}
        />
      )}

      {showShadowing && (
        <ShadowingPractice
          onGrade={handleShadowingGrade}
          onClose={() => setShowShadowing(false)}
        />
      )}

      {/* Browse Dialog */}
      <Dialog open={showBrowse} onOpenChange={setShowBrowse}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white px-5 pb-4 pt-5 sm:px-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl text-slate-900">
                <BookOpen size={21} className="text-emerald-600" />
                {selectedCategory ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.name} library` : "Vocabulary library"}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-slate-500">Search Korean, meanings, examples, or romanization.</p>
            <div className="relative mt-4">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={browseQuery}
                onChange={(event) => setBrowseQuery(event.target.value)}
                placeholder="Search the deck..."
                aria-label="Search vocabulary library"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {(["all", "new", "learning", "shaky", "known"] as const).map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setBrowseMastery(filter)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${browseMastery === filter ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"}`}
                >
                  {filter === "all" ? "All cards" : masteryLabels[filter]}
                  <span className="ml-1 opacity-70">{filter === "all" ? VOCABULARY_DATA.length : masteryCounts[filter]}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{filteredCards.length} matching card{filteredCards.length === 1 ? "" : "s"}</span>
              {(selectedCategory || browseQuery || browseMastery !== "all") && <button type="button" className="font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => { setSelectedCategory(null); setBrowseQuery(""); setBrowseMastery("all"); }}>Clear filters</button>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3 px-5 py-4 sm:px-6">
              {filteredCards.length > 0 ? (
                visibleBrowseCards.map((card) => {
                  const romanization = getRomanization(card);
                  const isShowingRoman = showRomanization[card.id];
                  const isCardPlaying = playingCardId === card.id;
                  const mastery = getMasteryState(state.cardStates[card.id]);
                  return (
                    <div
                      key={card.id}
                      aria-busy={isCardPlaying}
                      className={`rounded-2xl border p-4 transition-all ${
                        isCardPlaying
                          ? "audio-card-playing border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-200 shadow-lg shadow-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><div className="text-xl font-bold text-slate-900">{card.front}</div><span className="text-xs font-mono text-emerald-600">{romanization}</span></div>
                          <div className="mt-1 text-sm font-medium text-slate-600">{card.back}</div>
                          {isShowingRoman && romanization && (
                            <div className="text-sm text-emerald-600 font-mono font-semibold mt-1">
                              <span className="text-xs text-slate-500 mr-2">Romanization:</span>
                              {romanization}
                            </div>
                          )}
                          {card.example && (
                            <div className="text-xs text-slate-500 italic mt-2 line-clamp-2">"{ card.example}"</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCardPlaying && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                              Playing
                            </span>
                          )}
                          <Badge variant="secondary" className="capitalize whitespace-nowrap bg-slate-100 text-slate-600">
                            {card.tag}
                          </Badge>
                          <Badge className={`whitespace-nowrap ${masteryStyles[mastery]}`}>
                            {masteryLabels[mastery]}
                          </Badge>
                          {card.audioReady === false && (
                            <Badge variant="outline" className="whitespace-nowrap border-amber-200 bg-amber-50 text-amber-700">
                              Audio pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSpeaking || card.audioReady === false}
                          className={`flex-1 h-8 text-xs gap-1 disabled:opacity-50 ${
                            isCardPlaying
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                          onClick={() => speakKorean(card.id, card.front)}
                          aria-label={card.audioReady === false ? `Audio pending for ${card.front}` : isCardPlaying ? `Playing pronunciation for ${card.front}` : `Play pronunciation for ${card.front}`}
                        >
                          <Volume2 size={14} className={isCardPlaying ? "animate-pulse" : ""} />
                          {card.audioReady === false ? "Audio pending" : isCardPlaying ? "Playing..." : "Speak"}
                        </Button>
                        {romanization && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            onClick={() =>
                              setShowRomanization({
                                ...showRomanization,
                                [card.id]: !isShowingRoman,
                              })
                            }
                          >
                            {isShowingRoman ? (
                              <>
                                <EyeOff size={14} />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                Show
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <Search size={28} className="mx-auto text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">No matching cards</p>
                  <p className="mt-1 text-sm text-slate-400">Try a different search or clear your filters.</p>
                  </div>
              )}
              {visibleBrowseCards.length < filteredCards.length && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setBrowseVisibleCount((count) => Math.min(count + BROWSE_PAGE_SIZE, filteredCards.length))}
                >
                  Load 40 more · {filteredCards.length - visibleBrowseCards.length} remaining
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl"><Target size={20} className="text-emerald-600" /> Your Korean ability</DialogTitle>
            <p className="text-sm text-slate-500">Progress measured by recall, coverage, and durable review—not just completion.</p>
          </DialogHeader>
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-100">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Current level</p>
                <h3 className="mt-1 font-serif text-3xl">{levelTitle}</h3>
              </div>
              <div className="text-right"><div className="text-3xl font-bold">{state.stats.level}</div><div className="text-xs text-emerald-100">level</div></div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${levelProgress}%` }} /></div>
            <div className="mt-2 flex justify-between text-xs text-emerald-100"><span>{state.stats.totalXp} XP earned</span><span>{Math.max(0, nextLevelXp - state.stats.totalXp)} XP to next level</span></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <div className="text-xs text-yellow-600 font-medium">Total XP</div>
              <div className="text-3xl font-bold text-yellow-700">{state.stats.totalXp}</div>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="text-xs font-medium text-orange-600">Streak</div>
              <div className="text-3xl font-bold text-orange-700">{state.stats.streak}d</div>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-xs font-medium text-indigo-600">Recall</div>
              <div className="text-3xl font-bold text-indigo-700">{overallAccuracy}%</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-medium text-emerald-600">Known</div>
              <div className="text-3xl font-bold text-emerald-700">{masteredCount}</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-500">Reviews</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{totalReviews}</div>
              <div className="mt-1 text-[11px] text-slate-400">total attempts</div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <div className="text-xs font-medium text-blue-600">Learning</div>
              <div className="mt-1 text-2xl font-bold text-blue-700">{masteryCounts.learning}</div>
              <div className="mt-1 text-[11px] text-blue-600">cards in progress</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-medium text-amber-600">Due now</div>
              <div className="mt-1 text-2xl font-bold text-amber-700">{overdueCount}</div>
              <div className="mt-1 text-[11px] text-amber-600">reviews</div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Ability states</h3>
              <span className="text-xs text-slate-400">Based on spaced recall</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["new", "learning", "shaky", "known"] as MasteryState[]).map((mastery) => (
                <div key={mastery} className={`rounded-xl p-3 ${masteryStyles[mastery]}`}>
                  <div className="text-xs font-semibold">{masteryLabels[mastery]}</div>
                  <div className="mt-1 text-2xl font-bold">{masteryCounts[mastery]}</div>
                  <div className="text-[11px] opacity-75">cards</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">Known means at least three reviews with 75%+ recall and a review interval of seven days or more.</p>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Category mastery</h3>
              <span className="text-xs text-slate-400">Accuracy · coverage</span>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {categoryMastery.map((category) => (
                <div key={category.id} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true">{category.icon}</span>
                      <span className="truncate text-sm font-medium text-slate-700">{category.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {category.accuracy === null ? "Not started" : `${category.accuracy}% · ${category.reviewed}/${category.total}`}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${category.accuracy === null ? "bg-slate-200" : category.accuracy >= 80 ? "bg-emerald-500" : category.accuracy >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${category.accuracy ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="daily-goal">Daily Goal</label>
              <Select value={String(state.settings.dailyGoal)} onValueChange={handleDailyGoalChange}>
                <SelectTrigger id="daily-goal" className="mt-2 w-full bg-white">
                  <SelectValue placeholder="Choose a daily goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 cards · Quick practice</SelectItem>
                  <SelectItem value="10">10 cards · Balanced</SelectItem>
                  <SelectItem value="15">15 cards · Focused</SelectItem>
                  <SelectItem value="20">20 cards · Intensive</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Choose a goal you can sustain. Consistent recall is more valuable than a large daily streak.
              </p>
            </div>
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-slate-700">Text-to-Speech</label>
              <div className="text-sm text-slate-500 mt-1">
                {state.settings.ttsEnabled ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="audio-speaker">Korean speaker</label>
              <Select
                value={state.settings.audioSpeaker}
                onValueChange={(value) => handleSpeakerChange(value as AudioSpeaker)}
              >
                <SelectTrigger id="audio-speaker" className="w-full bg-white">
                  <SelectValue placeholder="Choose a speaker" />
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="elevenlabs">Hyuk · Cold &amp; Clear</SelectItem>
                  <SelectItem value="elevenlabs-female">Anna Kim · Tender, Calm &amp; Clear</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-slate-500">
                Goyo uses ElevenLabs recordings only. Choose Hyuk for a cold, clear delivery or Anna Kim for a tender, clear Seoul Korean voice.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

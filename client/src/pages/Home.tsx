import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Brain,
  CalendarDays,
  Flame,
  Star,
  Trophy,
  Play,
  BookOpen,
  BarChart2,
  Settings,
  TrendingUp,
  Zap,
  Volume2,
  Eye,
  EyeOff,
  Headphones,
  MapPin,
  Search,
  Download,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  buildExportPayload,
  getMasteryState,
  useStudyState,
  validateImportPayload,
  type MasteryState,
  type UserState,
} from "@/hooks/useStudyState";
import { useLocalDayKey } from "@/hooks/useLocalDay";
import { MASTERY_LABELS, MASTERY_STYLES } from "@/lib/mastery";
import { StudySession } from "@/components/StudySession";
import { StatsDialog } from "@/components/StatsDialog";
import { CATEGORIES } from "@/lib/vocabulary";
import { useVocabularyDeck } from "@/hooks/useVocabularyDeck";
import { DownloadAllAudio } from "@/components/DownloadAllAudio";
import { LazyBoundary } from "@/components/LazyBoundary";
import {
  describeBackupAge,
  getLastBackupAt,
  isBackupOverdue,
  recordBackup,
} from "@/lib/backupStatus";
import {
  markIosInstallHintShown,
  shouldSuggestIosInstall,
} from "@/lib/storageProtection";
import {
  playVocabularyAudio,
  stopAudio,
  setAudioSpeaker,
  type AudioSpeaker,
} from "@/lib/audioPlayer";
import { daysStudiedWithin, reviewsWithin } from "@/lib/studyDays";
import {
  buildDailyQueue,
  buildReviewForecast,
  countOverdue,
  nextScheduledReview as getNextScheduledReview,
  selectLearningCards,
  selectWeakCards,
  summarizeForecast,
} from "@/lib/queue";

const BROWSE_PAGE_SIZE = 40;

// Practice modes are secondary entry points, so they are lazily loaded to keep
// the initial bundle focused on the Daily Session flow.
const AlphabetPractice = lazy(() =>
  import("./AlphabetPractice").then(module => ({
    default: module.AlphabetPractice,
  }))
);
const ListeningPractice = lazy(() =>
  import("@/components/ListeningPractice").then(module => ({
    default: module.ListeningPractice,
  }))
);
const ScenarioPractice = lazy(() =>
  import("@/components/ScenarioPractice").then(module => ({
    default: module.ScenarioPractice,
  }))
);
const ShadowingPractice = lazy(() =>
  import("@/components/ShadowingPractice").then(module => ({
    default: module.ShadowingPractice,
  }))
);

function ModalLoadingFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading practice mode"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}

export default function Home() {
  const {
    state,
    gradeCard,
    updateSettings,
    replaceState,
    saveBlocked,
    saveError,
  } = useStudyState();
  // Recomputes at local midnight so an app left open overnight rolls over too.
  const today = useLocalDayKey();
  const { vocabulary, studyReady } = useVocabularyDeck();
  const [sessionQueue, setSessionQueue] = useState<typeof vocabulary>([]);
  // Snapshot of the reviewed cards chosen when a recognition mode opens, so a
  // grade does not reshuffle the questions mid-session.
  const [recognitionSessionCards, setRecognitionSessionCards] = useState<
    typeof vocabulary
  >([]);
  const [sessionMode, setSessionMode] = useState<"daily" | "weak" | "learning">(
    "daily"
  );
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
  const [browseMastery, setBrowseMastery] = useState<MasteryState | "all">(
    "all"
  );
  const [browseVisibleCount, setBrowseVisibleCount] =
    useState(BROWSE_PAGE_SIZE);
  const [showRomanization, setShowRomanization] = useState<
    Record<string, boolean>
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    state: UserState;
    exportedAt: string | null;
    fileName: string;
    hasReviewLog: boolean;
  } | null>(null);
  const [includeReviewLog, setIncludeReviewLog] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<Date | null>(() =>
    getLastBackupAt()
  );
  const importInputRef = useRef<HTMLInputElement>(null);
  // Baseline for "did the user just grade a card", so loading an existing save
  // never triggers the one-time iPhone install hint.
  const cardsStudiedTodayRef = useRef<number | null>(null);

  useEffect(() => {
    setAudioSpeaker(state.settings.audioSpeaker);
  }, [state.settings.audioSpeaker]);

  useEffect(() => {
    setBrowseVisibleCount(BROWSE_PAGE_SIZE);
  }, [browseQuery, browseMastery, selectedCategory]);

  // One gentle nudge per device: on iPhone the installable app is the only way
  // to get storage the browser will not evict.
  useEffect(() => {
    const count = state.studyDays[today]?.cards ?? 0;
    const previous = cardsStudiedTodayRef.current;
    cardsStudiedTodayRef.current = count;
    if (previous === null || count <= previous) return;
    if (!shouldSuggestIosInstall()) return;
    markIosInstallHintShown();
    toast.info("Add Goyo to your Home Screen", {
      description:
        "Tap Share, then Add to Home Screen. Safari can clear a website's saved progress after a week unused.",
      duration: 12000,
    });
  }, [state, today]);

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

  const handleNewCardsPerDayChange = (value: string) => {
    const newCardsPerDay = Number(value);
    if (!Number.isFinite(newCardsPerDay) || newCardsPerDay < 1) return;
    updateSettings({ newCardsPerDay });
    toast.success(`New cards set to ${newCardsPerDay} per day`);
  };

  const handleAutoPlayChange = (autoPlayAudio: boolean) => {
    updateSettings({ autoPlayAudio });
    if (!autoPlayAudio) stopAudio();
  };

  const handleExportProgress = () => {
    const payload = buildExportPayload(state, new Date(), { includeReviewLog });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const fileName = `goyo-progress-${today}.json`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    recordBackup();
    setLastBackupAt(new Date());

    const cardCount = Object.keys(state.cardStates).length;
    if (cardCount === 0) {
      toast.success("Exported a fresh save", {
        description: `${fileName} has no card progress yet.`,
      });
    } else {
      toast.success(
        `Exported progress for ${cardCount} ${cardCount === 1 ? "card" : "cards"}`,
        { description: fileName }
      );
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let result;
    try {
      result = validateImportPayload(await file.text());
    } catch {
      toast.error("Import failed", {
        description: "The file could not be read.",
      });
      return;
    }

    if (!result.ok) {
      toast.error("Import failed", { description: result.reason });
      return;
    }
    setPendingImport({
      state: result.state,
      exportedAt: result.exportedAt,
      fileName: file.name,
      hasReviewLog: result.hasReviewLog,
    });
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    // A progress-only file must not wipe the local review log.
    replaceState({
      ...pendingImport.state,
      reviewLog: pendingImport.hasReviewLog
        ? pendingImport.state.reviewLog
        : state.reviewLog,
    });
    const cardCount = Object.keys(pendingImport.state.cardStates).length;
    setPendingImport(null);
    toast.success(
      `Imported progress for ${cardCount} ${cardCount === 1 ? "card" : "cards"}`
    );
  };

  const speakKorean = async (wordId: string) => {
    setIsSpeaking(true);
    setPlayingCardId(wordId);
    try {
      await playVocabularyAudio(wordId);
    } finally {
      setIsSpeaking(false);
      setPlayingCardId(null);
    }
  };

  const getRomanization = (card: (typeof vocabulary)[0]) => {
    return card.romanization || "";
  };

  const cardStates = state.cardStates;
  const cardsStudiedToday = state.studyDays[today]?.cards ?? 0;
  const dailyGoal = state.settings.dailyGoal;
  const daysStudied7 = daysStudiedWithin(state.studyDays, today, 7);
  const daysStudied30 = daysStudiedWithin(state.studyDays, today, 30);
  const reviews7 = reviewsWithin(state.studyDays, today, 7);

  const masteryCounts = useMemo(
    () =>
      vocabulary.reduce<Record<MasteryState, number>>(
        (counts, card) => {
          counts[getMasteryState(cardStates?.[card.id])] += 1;
          return counts;
        },
        { new: 0, learning: 0, shaky: 0, known: 0 }
      ),
    [vocabulary, cardStates]
  );

  const reviewStats = useMemo(() => {
    const reviewedCards = cardStates
      ? vocabulary.filter(card => Boolean(cardStates[card.id]?.timesReviewed))
      : [];
    const totalReviews = reviewedCards.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesReviewed ?? 0),
      0
    );
    const totalCorrect = reviewedCards.reduce(
      (sum, card) => sum + (cardStates?.[card.id]?.timesCorrect ?? 0),
      0
    );
    const overallAccuracy =
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
    const responseTimes = reviewedCards
      .map(card => cardStates?.[card.id]?.lastResponseTimeMs)
      .filter((time): time is number => typeof time === "number" && time > 0)
      .sort((a, b) => a - b);
    const medianResponseTime =
      responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : null;
    return { totalReviews, overallAccuracy, medianResponseTime };
  }, [vocabulary, cardStates]);

  const categoryMastery = useMemo(
    () =>
      CATEGORIES.map(category => {
        const cards = vocabulary.filter(card => card.tag === category.id);
        const reviewed = cards.filter(card =>
          Boolean(cardStates?.[card.id]?.timesReviewed)
        );
        const reviews = reviewed.reduce(
          (sum, card) => sum + (cardStates?.[card.id]?.timesReviewed ?? 0),
          0
        );
        const correct = reviewed.reduce(
          (sum, card) => sum + (cardStates?.[card.id]?.timesCorrect ?? 0),
          0
        );
        return {
          ...category,
          reviewed: reviewed.length,
          total: cards.length,
          accuracy: reviews > 0 ? Math.round((correct / reviews) * 100) : null,
        };
      }),
    [vocabulary, cardStates]
  );

  // Derived from saved progress, so it is current on the same render as a grade.
  const queue = useMemo(() => {
    return buildDailyQueue(
      studyReady,
      cardStates,
      today,
      dailyGoal,
      cardsStudiedToday,
      state.settings.newCardsPerDay
    );
  }, [
    cardStates,
    cardsStudiedToday,
    dailyGoal,
    studyReady,
    today,
    state.settings.newCardsPerDay,
  ]);

  // Recognition practice never introduces a card: due and weak reviews come
  // first, then the rest of the learner's existing cards.
  const recognitionCards = useMemo(() => {
    const reviewed = studyReady.filter(card =>
      Boolean(cardStates[card.id]?.timesReviewed)
    );
    const due = reviewed
      .filter(card => {
        const dueDate = cardStates[card.id]?.due;
        return Boolean(dueDate && dueDate <= today);
      })
      .sort((a, b) =>
        (cardStates[a.id]?.due ?? today).localeCompare(
          cardStates[b.id]?.due ?? today
        )
      );
    const dueIds = new Set(due.map(card => card.id));
    const weak = reviewed
      .filter(
        card =>
          !dueIds.has(card.id) &&
          getMasteryState(cardStates[card.id]) !== "known"
      )
      .sort((a, b) => {
        const aState = cardStates[a.id];
        const bState = cardStates[b.id];
        return (
          (aState?.timesCorrect ?? 0) / (aState?.timesReviewed ?? 1) -
          (bState?.timesCorrect ?? 0) / (bState?.timesReviewed ?? 1)
        );
      });
    const weakIds = new Set(weak.map(card => card.id));
    const rest = reviewed.filter(
      card => !dueIds.has(card.id) && !weakIds.has(card.id)
    );
    return [...due, ...weak, ...rest];
  }, [cardStates, studyReady, today]);

  const openRecognitionPractice = (open: () => void) => {
    if (recognitionCards.length < 4) {
      toast.info("Study a few cards first", {
        description:
          "Listening and scenarios use cards you have already reviewed, so nothing new is introduced.",
      });
      return;
    }
    setRecognitionSessionCards(recognitionCards);
    open();
  };

  const handleGrade = (
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: { responseTimeMs?: number }
  ) => {
    const isRepeatPractice = sessionMode === "daily" && dailyGoalReached;
    const wasBelowGoal =
      !isRepeatPractice && cardsStudiedToday < state.settings.dailyGoal;
    gradeCard(cardId, rating, {
      countProgress: !isRepeatPractice,
      responseTimeMs: options?.responseTimeMs,
      mode: sessionMode,
    });

    const xpGain = rating === "easy" ? 15 : rating === "good" ? 10 : 5;
    const isSameDayRepeat = state.cardStates[cardId]?.lastReviewDate === today;
    if (
      wasBelowGoal &&
      !isSameDayRepeat &&
      cardsStudiedToday + 1 >= state.settings.dailyGoal
    ) {
      setTimeout(() => {
        toast.success("Daily goal reached! 🎉", {
          description: `You've earned ${xpGain} XP and maintained your streak!`,
        });
      }, 300);
    }
  };

  const startSession = () => {
    if (queue.length === 0) {
      toast.info("Your planned reviews are complete", {
        description: "Come back tomorrow for the next new-word batch.",
      });
      return;
    }
    setSessionQueue([...queue]);
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
      toast.info("No Learning or Shaky cards yet", {
        description: "Start a Daily Session to build your review path.",
      });
      return;
    }
    setSessionQueue(learningCards);
    setSessionMode("learning");
    setIsStudying(true);
  };

  const handleListeningGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating, { mode: "listening" });
  };

  const handleScenarioGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating, { mode: "scenario" });
  };

  const handleShadowingGrade = (cardId: string, rating: "again" | "good") => {
    gradeCard(cardId, rating, { mode: "shadowing", practiceOnly: true });
  };

  const cardsRemaining = Math.max(
    0,
    state.settings.dailyGoal - cardsStudiedToday
  );
  const plannedCards = queue.length;
  const progressPercent = (cardsStudiedToday / state.settings.dailyGoal) * 100;
  const dailyGoalReached = cardsStudiedToday >= state.settings.dailyGoal;
  const levelTitles = [
    "Beginner",
    "Explorer",
    "Builder",
    "Conversational",
    "Fluent",
    "Korean Sage",
  ];
  const levelTitle =
    levelTitles[
      Math.min(levelTitles.length - 1, Math.max(0, state.stats.level - 1))
    ];
  const currentLevelXp = Math.pow(Math.max(0, state.stats.level - 1), 2) * 100;
  const nextLevelXp = Math.pow(state.stats.level, 2) * 100;
  const levelProgress =
    nextLevelXp > currentLevelXp
      ? Math.min(
          100,
          Math.max(
            0,
            ((state.stats.totalXp - currentLevelXp) /
              (nextLevelXp - currentLevelXp)) *
              100
          )
        )
      : 100;
  const overdueCount = countOverdue(studyReady, state.cardStates, today);
  const overduePrefix =
    overdueCount > 0
      ? `${overdueCount} review${overdueCount === 1 ? "" : "s"} due · `
      : "";
  const weakCards = useMemo(
    () => selectWeakCards(studyReady, state.cardStates, today),
    [studyReady, state.cardStates, today]
  );
  const learningCards = useMemo(
    () => selectLearningCards(studyReady, state.cardStates, today),
    [studyReady, state.cardStates, today]
  );
  const normalizedBrowseQuery = browseQuery.trim().toLocaleLowerCase();
  const filteredCards = !showBrowse
    ? []
    : vocabulary.filter(card => {
        const matchesCategory =
          !selectedCategory || card.tag === selectedCategory;
        const matchesMastery =
          browseMastery === "all" ||
          getMasteryState(state.cardStates[card.id]) === browseMastery;
        const matchesQuery =
          !normalizedBrowseQuery ||
          [card.front, card.back, card.romanization, card.example].some(value =>
            value.toLocaleLowerCase().includes(normalizedBrowseQuery)
          );
        return matchesCategory && matchesMastery && matchesQuery;
      });
  const visibleBrowseCards = filteredCards.slice(0, browseVisibleCount);
  const { totalReviews, overallAccuracy, medianResponseTime } = reviewStats;
  const reviewForecast = useMemo(() => {
    return buildReviewForecast(studyReady, state.cardStates, today, 7, {
      overdueOnFirstDay: true,
    }).map((day, offset) => ({
      ...day,
      label:
        offset === 0
          ? "Today"
          : offset === 1
            ? "Tomorrow"
            : new Date(`${day.key}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "short",
              }),
    }));
  }, [studyReady, state.cardStates, today]);
  const extendedReviewForecast = useMemo(() => {
    return buildReviewForecast(studyReady, state.cardStates, today, 30).map(
      day => ({
        ...day,
        label: new Date(`${day.key}T12:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      })
    );
  }, [studyReady, state.cardStates, today]);
  const {
    total: forecastTotal,
    peak: forecastPeak,
    status: workloadStatus,
  } = useMemo(
    () => summarizeForecast(extendedReviewForecast, state.settings.dailyGoal),
    [extendedReviewForecast, state.settings.dailyGoal]
  );
  const nextScheduledReview = getNextScheduledReview(
    state.cardStates,
    vocabulary,
    today
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      {/* Header */}
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
                L{state.stats.level}
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
              <span className="text-sm font-bold text-orange-600">
                {state.stats.streak}
              </span>
              <span className="hidden text-xs text-orange-500 sm:inline">
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
              <span className="text-sm font-bold text-yellow-600">
                {state.stats.totalXp}
              </span>
              <span className="hidden text-xs text-yellow-600 sm:inline">
                XP
              </span>
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
        {saveBlocked && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm"
          >
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                A newer save from Goyo is stored in this browser.
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                This tab was built for an older save format, so it will not
                overwrite that progress, and new study in this tab will not be
                saved. Update Goyo and reload this page to continue where you
                left off.
              </p>
            </div>
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-sm"
          >
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">Your progress is not being saved.</p>
              <p className="mt-1 text-sm leading-relaxed">
                This browser's storage is full or blocked, so changes in this
                tab are only kept in memory. Export your progress from Settings
                before closing or reloading the page.
              </p>
            </div>
          </div>
        )}

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
                className="relative z-10 flex h-14 w-full touch-manipulation items-center justify-center rounded-lg bg-white px-6 text-lg font-bold text-emerald-600 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.99]"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  startSession();
                }}
                aria-label={
                  dailyGoalReached
                    ? "Review what you know"
                    : "Start daily session"
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
                  {cardsStudiedToday}/{state.settings.dailyGoal}
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 mt-3 bg-slate-100"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Cards studied today · up to {state.settings.newCardsPerDay}{" "}
                  new {state.settings.newCardsPerDay === 1 ? "word" : "words"}{" "}
                  per day
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
                  Level {state.stats.level}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {levelTitle}
                  </div>
                  <div className="text-sm font-semibold text-emerald-600">
                    Lv. {state.stats.level}
                  </div>
                </div>
                <Progress
                  value={levelProgress}
                  className="mt-3 h-2 bg-slate-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {Math.max(0, nextLevelXp - state.stats.totalXp)} XP to next
                  level
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
                <p className="text-xs text-slate-500 mt-2">
                  {Math.round(
                    (state.stats.totalCardsLearned / studyReady.length) * 100
                  )}
                  % of study-ready deck
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
                <Badge
                  className={
                    overdueCount > 0
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  }
                >
                  {overdueCount > 0 ? "Focus today" : "On track"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {reviewForecast.map(day => {
                  const isToday = day.key === today;
                  const intensity =
                    day.count === 0
                      ? "bg-slate-100 text-slate-400"
                      : day.count <= 2
                        ? "bg-emerald-100 text-emerald-700"
                        : day.count <= 5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-orange-200 text-orange-800";
                  return (
                    <div key={day.key} className="text-center">
                      <div
                        className={`mb-1 text-[10px] font-semibold ${isToday ? "text-emerald-700" : "text-slate-400"}`}
                      >
                        {day.label}
                      </div>
                      <div
                        className={`flex h-10 items-center justify-center rounded-xl text-sm font-bold ${intensity} ${isToday ? "ring-2 ring-emerald-300 ring-offset-1" : ""}`}
                      >
                        {day.count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Cards are scheduled automatically after each review.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={startSession}
                >
                  <Play size={14} className="mr-2" />
                  {overdueCount > 0 ? "Review due cards" : "Start a session"}
                </Button>
              </div>
              <div
                className={`mt-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${workloadStatus === "heavy" ? "border-amber-200 bg-amber-50 text-amber-800" : workloadStatus === "busy" ? "border-indigo-100 bg-indigo-50 text-indigo-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}
                role="status"
              >
                <span className="font-semibold">
                  {workloadStatus === "heavy"
                    ? "Plan a lighter week."
                    : workloadStatus === "busy"
                      ? "A busier review day is coming."
                      : "Your review load is balanced."}
                </span>{" "}
                {forecastPeak.count > 0
                  ? `The peak is ${forecastPeak.count} scheduled review${forecastPeak.count === 1 ? "" : "s"} on ${forecastPeak.label}. Short, consistent sessions will keep it manageable.`
                  : "New cards will be introduced gradually as you build your review history."}
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
          onClick={() => openRecognitionPractice(() => setShowListening(true))}
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-base hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center gap-2 text-2xl mb-1">
            <Headphones size={25} />
          </div>
          Listening Practice
          <div className="text-xs font-normal text-slate-300 mt-1">
            10 audio-first questions · due and weak cards first
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => openRecognitionPractice(() => setShowScenarios(true))}
          className="mb-6 w-full rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg"
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
            <MapPin size={25} />
          </div>
          Survival Scenarios
          <div className="mt-1 text-xs font-normal text-rose-50">
            Real-world situations · reviewed phrases only
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowShadowing(true)}
          className="mb-6 w-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg"
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
            <Headphones size={25} />
          </div>
          Shadowing Practice
          <div className="mt-1 text-xs font-normal text-indigo-50">
            8 phrases · practice only, your schedule stays put
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startWeakSession}
          disabled={weakCards.length === 0}
          className="w-full mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
            <Brain size={25} />
          </div>
          Weak Words
          <div className="mt-1 text-xs font-normal text-amber-50">
            {weakCards.length > 0
              ? `${weakCards.length} cards selected from your lowest recall`
              : "Review a few cards to unlock personalized training"}
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startLearningSession}
          className="mb-6 w-full rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-4 text-base font-bold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          disabled={learningCards.length === 0}
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-2xl">
            <BookOpen size={25} />
          </div>
          Learning Review
          <div className="mt-1 text-xs font-normal text-blue-50">
            {learningCards.length > 0
              ? `${learningCards.length} Learning and Shaky cards need another pass`
              : "Cards will appear here as you begin reviewing"}
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
              onClick={() => {
                setSelectedCategory(null);
                setBrowseMastery("all");
                setShowBrowse(true);
              }}
            >
              View all {vocabulary.length}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(cat => {
              const category = categoryMastery.find(item => item.id === cat.id);
              const known = vocabulary.filter(
                card =>
                  card.tag === cat.id &&
                  getMasteryState(state.cardStates[card.id]) === "known"
              ).length;
              const coverage = category?.total
                ? Math.round((known / category.total) * 100)
                : 0;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setBrowseMastery("all");
                    setBrowseQuery("");
                    setShowBrowse(true);
                  }}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${cat.color}`}
                        aria-hidden="true"
                      >
                        {cat.icon}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {category?.total ?? 0} cards
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">
                      {coverage}%
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${coverage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {known} known · {category?.reviewed ?? 0} reviewed
                  </p>
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
          allowRepeat={
            dailyGoalReached ||
            sessionMode === "weak" ||
            sessionMode === "learning"
          }
          autoPlayAudio={state.settings.autoPlayAudio}
          title={
            sessionMode === "weak"
              ? "Weak Words"
              : sessionMode === "learning"
                ? "Learning Review"
                : "Daily Session"
          }
        />
      )}

      {/* Alphabet Practice Modal */}
      {showAlphabet && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => setShowAlphabet(false)}>
            <AlphabetPractice onClose={() => setShowAlphabet(false)} />
          </LazyBoundary>
        </Suspense>
      )}

      {showListening && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => setShowListening(false)}>
            <ListeningPractice
              cards={recognitionSessionCards}
              onGrade={handleListeningGrade}
              onClose={() => setShowListening(false)}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {showScenarios && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => setShowScenarios(false)}>
            <ScenarioPractice
              cards={recognitionSessionCards}
              onGrade={handleScenarioGrade}
              onClose={() => setShowScenarios(false)}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {showShadowing && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => setShowShadowing(false)}>
            <ShadowingPractice
              cards={studyReady}
              onGrade={handleShadowingGrade}
              onClose={() => setShowShadowing(false)}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {/* Browse Dialog */}
      <Dialog
        open={showBrowse}
        onOpenChange={open => {
          if (!open) {
            stopAudio();
            setPlayingCardId(null);
          }
          setShowBrowse(open);
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white px-5 pb-4 pt-5 sm:px-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl text-slate-900">
                <BookOpen size={21} className="text-emerald-600" />
                {selectedCategory
                  ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name} library`
                  : "Vocabulary library"}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="mt-1 text-sm text-slate-500">
              Search Korean, meanings, examples, or romanization.
            </DialogDescription>
            <div className="relative mt-4">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={browseQuery}
                onChange={event => setBrowseQuery(event.target.value)}
                placeholder="Search the deck..."
                aria-label="Search vocabulary library"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {(["all", "new", "learning", "shaky", "known"] as const).map(
                filter => (
                  <button
                    type="button"
                    key={filter}
                    onClick={() => setBrowseMastery(filter)}
                    aria-pressed={browseMastery === filter}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${browseMastery === filter ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"}`}
                  >
                    {filter === "all" ? "All cards" : MASTERY_LABELS[filter]}
                    <span className="ml-1 opacity-70">
                      {filter === "all"
                        ? vocabulary.length
                        : masteryCounts[filter]}
                    </span>
                  </button>
                )
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                {filteredCards.length} matching card
                {filteredCards.length === 1 ? "" : "s"}
              </span>
              {(selectedCategory || browseQuery || browseMastery !== "all") && (
                <button
                  type="button"
                  className="font-semibold text-emerald-700 hover:text-emerald-900"
                  onClick={() => {
                    setSelectedCategory(null);
                    setBrowseQuery("");
                    setBrowseMastery("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3 px-5 py-4 sm:px-6">
              {filteredCards.length > 0 ? (
                visibleBrowseCards.map(card => {
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
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className="text-xl font-bold text-slate-900"
                              lang="ko"
                            >
                              {card.front}
                            </div>
                            {isShowingRoman && romanization && (
                              <span className="text-xs font-mono text-emerald-600">
                                {romanization}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm font-medium text-slate-600">
                            {card.back}
                          </div>
                          {isShowingRoman && romanization && (
                            <div className="text-sm text-emerald-600 font-mono font-semibold mt-1">
                              <span className="text-xs text-slate-500 mr-2">
                                Romanization:
                              </span>
                              {romanization}
                            </div>
                          )}
                          {card.example && (
                            <div
                              className="text-xs text-slate-500 italic mt-2 line-clamp-2"
                              lang="ko"
                            >
                              "{card.example}"
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCardPlaying && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"
                                aria-hidden="true"
                              />
                              Playing
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className="capitalize whitespace-nowrap bg-slate-100 text-slate-600"
                          >
                            {card.tag}
                          </Badge>
                          <Badge
                            className={`whitespace-nowrap ${MASTERY_STYLES[mastery]}`}
                          >
                            {MASTERY_LABELS[mastery]}
                          </Badge>
                          {card.audioReady === false && (
                            <Badge
                              variant="outline"
                              className="whitespace-nowrap border-amber-200 bg-amber-50 text-amber-700"
                            >
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
                          onClick={() => speakKorean(card.id)}
                          aria-label={
                            card.audioReady === false
                              ? `Audio pending for ${card.front}`
                              : isCardPlaying
                                ? `Playing pronunciation for ${card.front}`
                                : `Play pronunciation for ${card.front}`
                          }
                        >
                          <Volume2
                            size={14}
                            className={isCardPlaying ? "animate-pulse" : ""}
                          />
                          {card.audioReady === false
                            ? "Audio pending"
                            : isCardPlaying
                              ? "Playing..."
                              : "Speak"}
                        </Button>
                        {romanization && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-pressed={Boolean(isShowingRoman)}
                            aria-label={`${isShowingRoman ? "Hide" : "Show"} romanization for ${card.front}`}
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
                  <p className="mt-3 font-semibold text-slate-700">
                    No matching cards
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try a different search or clear your filters.
                  </p>
                </div>
              )}
              {visibleBrowseCards.length < filteredCards.length && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() =>
                    setBrowseVisibleCount(count =>
                      Math.min(count + BROWSE_PAGE_SIZE, filteredCards.length)
                    )
                  }
                >
                  Load 40 more ·{" "}
                  {filteredCards.length - visibleBrowseCards.length} remaining
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <StatsDialog
        open={showStats}
        onOpenChange={setShowStats}
        today={today}
        stats={{
          level: state.stats.level,
          totalXp: state.stats.totalXp,
          nextLevelXp,
          streak: state.stats.streak,
          levelTitle,
          levelProgress,
          totalReviews,
          overallAccuracy,
          masteredCount: masteryCounts.known,
          medianResponseTime,
          overdueCount,
          daysStudied7,
          daysStudied30,
          reviews7,
          masteryCounts,
          categories: categoryMastery,
        }}
        forecast={{
          days: extendedReviewForecast,
          total: forecastTotal,
          peak: forecastPeak,
        }}
      />

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onOpenChange={open => {
          setShowSettings(open);
          if (!open) setPendingImport(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription className="sr-only">
              Daily goal, Korean speaker, and progress export and import.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="daily-goal"
              >
                Daily Goal
              </label>
              <Select
                value={String(state.settings.dailyGoal)}
                onValueChange={handleDailyGoalChange}
              >
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
                Choose a goal you can sustain. Consistent recall is more
                valuable than a large daily streak.
              </p>
            </div>
            <div className="border-t pt-4">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="new-cards-per-day"
              >
                New cards per day
              </label>
              <Select
                value={String(state.settings.newCardsPerDay)}
                onValueChange={handleNewCardsPerDayChange}
              >
                <SelectTrigger
                  id="new-cards-per-day"
                  className="mt-2 w-full bg-white"
                >
                  <SelectValue placeholder="Choose a new-card pace" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 8, 10].map(count => (
                    <SelectItem key={count} value={String(count)}>
                      {count} new {count === 1 ? "card" : "cards"} per day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Brand-new words are capped at this number each day, so the daily
                goal can run shorter on a fresh deck. Due reviews still come
                first, so a lower pace keeps the session short without hiding
                scheduled work.
              </p>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="auto-play-audio"
                  >
                    Auto-play pronunciation
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Play the clip as each card appears. Off leaves audio to the
                    speaker button, so nothing plays until you tap.
                  </p>
                </div>
                <Switch
                  id="auto-play-audio"
                  checked={state.settings.autoPlayAudio}
                  onCheckedChange={checked => handleAutoPlayChange(checked)}
                />
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="audio-speaker"
              >
                Korean speaker
              </label>
              <Select
                value={state.settings.audioSpeaker}
                onValueChange={value =>
                  handleSpeakerChange(value as AudioSpeaker)
                }
              >
                <SelectTrigger id="audio-speaker" className="w-full bg-white">
                  <SelectValue placeholder="Choose a speaker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevenlabs">
                    Hyuk · Cold &amp; Clear
                  </SelectItem>
                  <SelectItem value="elevenlabs-female">
                    Jini · Warm &amp; Intelligent
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-slate-500">
                Goyo uses ElevenLabs recordings only. Choose Hyuk for a cold,
                clear delivery or Jini for a warm, intelligent Seoul Korean
                voice.
              </p>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="text-sm font-medium text-slate-700">
                Progress file
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Progress is saved only in this browser. Export a JSON file to
                move it to another device, then import that file there.
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs leading-relaxed text-slate-500">
                  {describeBackupAge(lastBackupAt)}
                </p>
                {isBackupOverdue(lastBackupAt) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={handleExportProgress}
                  >
                    Export now
                  </Button>
                )}
              </div>
              <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Checkbox
                  id="include-review-log"
                  checked={includeReviewLog}
                  onCheckedChange={checked =>
                    setIncludeReviewLog(checked === true)
                  }
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed text-slate-600">
                  <span className="block text-sm font-medium text-slate-700">
                    Include review log
                  </span>
                  Adds {state.reviewLog.entries.length}{" "}
                  {state.reviewLog.entries.length === 1 ? "entry" : "entries"}{" "}
                  of grade history for analysis. Leave it off to keep the file
                  small; it is not needed to restore progress.
                </span>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white sm:flex-1"
                  onClick={handleExportProgress}
                >
                  <Download aria-hidden="true" />
                  Export progress
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white sm:flex-1"
                  onClick={() => importInputRef.current?.click()}
                >
                  <Upload aria-hidden="true" />
                  Import progress
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
              {pendingImport && (
                <div
                  role="region"
                  aria-labelledby="import-confirm-title"
                  className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
                >
                  <p
                    id="import-confirm-title"
                    className="text-sm font-medium text-amber-900"
                  >
                    Replace current progress?
                  </p>
                  <p className="text-xs leading-relaxed text-amber-900">
                    {pendingImport.fileName} contains{" "}
                    {Object.keys(pendingImport.state.cardStates).length}{" "}
                    {Object.keys(pendingImport.state.cardStates).length === 1
                      ? "card"
                      : "cards"}
                    {pendingImport.exportedAt
                      ? `, exported ${new Date(pendingImport.exportedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
                      : ""}
                    . Importing it replaces your current progress (
                    {Object.keys(state.cardStates).length} cards) in this
                    browser. Export first if you want to keep it.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={confirmImport}
                    >
                      Replace progress
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      autoFocus
                      onClick={() => setPendingImport(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DownloadAllAudio />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

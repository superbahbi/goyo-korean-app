import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStudyState } from "@/hooks/useStudyState";
import { useLocalDayKey } from "@/hooks/useLocalDay";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useHomeSessions } from "@/hooks/useHomeSessions";
import { useDialogLauncher } from "@/hooks/useDialogLauncher";
import { useVocabularyDeck } from "@/hooks/useVocabularyDeck";
import { HomeHeader } from "@/components/HomeHeader";
import { SaveAlerts } from "@/components/SaveAlerts";
import { WelcomeCard } from "@/components/WelcomeCard";
import { ProgressCards } from "@/components/ProgressCards";
import { ReviewPlanCard } from "@/components/ReviewPlanCard";
import { PracticeMenu } from "@/components/PracticeMenu";
import { QuickLinks } from "@/components/QuickLinks";
import { CategoryGrid } from "@/components/CategoryGrid";
import {
  HomeDialogHost,
  type StudySessionDeps,
} from "@/components/HomeDialogHost";
import type { HomeDialogDeps } from "@/components/dialogs/registry";
import {
  markIosInstallHintShown,
  shouldSuggestIosInstall,
} from "@/lib/storageProtection";
import { setAudioSpeaker } from "@/lib/audioPlayer";

export default function Home() {
  const {
    state,
    gradeCard,
    updateSettings,
    recordGrammarResult,
    replaceState,
    saveBlocked,
    saveError,
  } = useStudyState();
  // Recomputes at local midnight so an app left open overnight rolls over too.
  const today = useLocalDayKey();
  const { vocabulary, studyReady } = useVocabularyDeck();
  const { activeDialog, open, close } = useDialogLauncher();
  // Browse remembers the last category, so "Browse Deck" returns to where the
  // learner left off while a theme tile still preselects its own category.
  const lastBrowseCategory = useRef<string | null>(null);
  // Baseline for "did the user just grade a card", so loading an existing save
  // never triggers the one-time iPhone install hint.
  const cardsStudiedTodayRef = useRef<number | null>(null);

  const {
    daysStudied7,
    daysStudied30,
    reviews7,
    masteryCounts,
    reviewStats,
    categoryMastery,
    queue,
    recognitionCards,
    weakCards,
    learningCards,
    reviewForecast,
    extendedReviewForecast,
    forecastTotal,
    forecastPeak,
    workloadStatus,
    cardsRemaining,
    plannedCards,
    newCardsPlanned,
    firstRun,
    todayProgress,
    dailyGoalReached,
    levelTitle,
    nextLevelXp,
    levelProgress,
    overdueCount,
    nextScheduledReview,
  } = useHomeDashboard({
    vocabulary,
    studyReady,
    cardStates: state.cardStates,
    studyDays: state.studyDays,
    reviewEntries: state.reviewLog.entries.length,
    today,
    dailyGoal: state.settings.dailyGoal,
    newCardsPerDay: state.settings.newCardsPerDay,
    level: state.stats.level,
    totalXp: state.stats.totalXp,
  });

  const {
    sessionQueue,
    recognitionSessionCards,
    sessionMode,
    isStudying,
    openRecognitionPractice,
    handleGrade,
    startSession,
    startWeakSession,
    startLearningSession,
    handleListeningGrade,
    handleScenarioGrade,
    handleShadowingGrade,
    closeSession,
  } = useHomeSessions({
    queue,
    weakCards,
    learningCards,
    recognitionCards,
    gradeCard,
  });

  useEffect(() => {
    setAudioSpeaker(state.settings.audioSpeaker);
  }, [state.settings.audioSpeaker]);

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

  const { totalReviews, overallAccuracy, medianResponseTime } = reviewStats;

  const openBrowse = (category: string | null = lastBrowseCategory.current) => {
    lastBrowseCategory.current = category;
    open({ kind: "browse", category });
  };

  const dialogDeps: HomeDialogDeps = {
    today,
    state,
    settings: { updateSettings, replaceState },
    grammar: { progress: state.grammar, onComplete: recordGrammarResult },
    recognition: {
      cards: recognitionSessionCards,
      onListeningGrade: handleListeningGrade,
      onScenarioGrade: handleScenarioGrade,
    },
    shadowing: { cards: studyReady, onGrade: handleShadowingGrade },
    browse: { vocabulary },
    stats: {
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
    },
    forecast: {
      days: extendedReviewForecast,
      total: forecastTotal,
      peak: forecastPeak,
    },
  };

  const studyDeps: StudySessionDeps = {
    isStudying,
    queue: sessionQueue,
    mode: sessionMode,
    dailyGoalReached,
    onGrade: handleGrade,
    onClose: closeSession,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50 dark:via-emerald-950/40 to-muted">
      <HomeHeader
        streak={state.stats.streak}
        totalXp={state.stats.totalXp}
        onOpenSettings={() => open({ kind: "settings" })}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:space-y-7 sm:px-6 sm:py-8">
        <SaveAlerts saveBlocked={saveBlocked} saveError={saveError} />

        {/* First run gets one primary action, not a hero plus a start card. */}
        {!firstRun && (
          <WelcomeCard
            cardsRemaining={cardsRemaining}
            plannedCards={plannedCards}
            newCards={newCardsPlanned}
            overdueCount={overdueCount}
            dailyGoalReached={dailyGoalReached}
            onStartSession={startSession}
          />
        )}

        <ProgressCards
          firstRun={firstRun}
          todayProgress={todayProgress}
          level={state.stats.level}
          levelTitle={levelTitle}
          levelProgress={levelProgress}
          totalXp={state.stats.totalXp}
          nextLevelXp={nextLevelXp}
          totalCardsLearned={state.stats.totalCardsLearned}
          studyReadyCount={studyReady.length}
          onStartSession={startSession}
          onOpenAlphabet={() => open({ kind: "alphabet" })}
        />

        {!firstRun && (
          <ReviewPlanCard
            today={today}
            overdueCount={overdueCount}
            nextScheduledReview={nextScheduledReview}
            forecast={reviewForecast}
            forecastPeak={forecastPeak}
            workloadStatus={workloadStatus}
          />
        )}

        <PracticeMenu
          quiet={firstRun}
          weakCardCount={weakCards.length}
          learningCardCount={learningCards.length}
          grammarCompleted={state.grammar.completedLessonIds.length}
          onOpenAlphabet={() => open({ kind: "alphabet" })}
          onOpenGrammar={() => open({ kind: "grammar" })}
          onOpenListening={() =>
            openRecognitionPractice(() => open({ kind: "listening" }))
          }
          onOpenScenarios={() =>
            openRecognitionPractice(() => open({ kind: "scenario" }))
          }
          onOpenShadowing={() => open({ kind: "shadowing" })}
          onStartWeakSession={startWeakSession}
          onStartLearningSession={startLearningSession}
        />

        <QuickLinks
          onOpenBrowse={() => openBrowse()}
          onOpenStats={() => open({ kind: "stats" })}
        />

        {!firstRun && (
          <CategoryGrid
            categories={categoryMastery}
            vocabularyCount={vocabulary.length}
            onViewAll={() => {
              openBrowse(null);
            }}
            onSelectCategory={categoryId => {
              openBrowse(categoryId);
            }}
          />
        )}
      </main>

      <HomeDialogHost
        dialog={activeDialog}
        onClose={close}
        deps={dialogDeps}
        study={studyDeps}
      />
    </div>
  );
}

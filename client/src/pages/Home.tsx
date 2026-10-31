import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStudyState } from "@/hooks/useStudyState";
import { useLocalDayKey } from "@/hooks/useLocalDay";
import { useHomeDashboard } from "@/hooks/useHomeDashboard";
import { useHomeSessions } from "@/hooks/useHomeSessions";
import { useVocabularyDeck } from "@/hooks/useVocabularyDeck";
import { HomeHeader } from "@/components/HomeHeader";
import { SaveAlerts } from "@/components/SaveAlerts";
import { WelcomeCard } from "@/components/WelcomeCard";
import { ProgressCards } from "@/components/ProgressCards";
import { ReviewPlanCard } from "@/components/ReviewPlanCard";
import { PracticeMenu } from "@/components/PracticeMenu";
import { QuickLinks } from "@/components/QuickLinks";
import { CategoryGrid } from "@/components/CategoryGrid";
import { HomeDialogs } from "@/components/HomeDialogs";
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
    replaceState,
    saveBlocked,
    saveError,
  } = useStudyState();
  // Recomputes at local midnight so an app left open overnight rolls over too.
  const today = useLocalDayKey();
  const { vocabulary, studyReady } = useVocabularyDeck();
  const [showBrowse, setShowBrowse] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlphabet, setShowAlphabet] = useState(false);
  const [showListening, setShowListening] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showShadowing, setShowShadowing] = useState(false);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  // Baseline for "did the user just grade a card", so loading an existing save
  // never triggers the one-time iPhone install hint.
  const cardsStudiedTodayRef = useRef<number | null>(null);

  const {
    cardsStudiedToday,
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
    progressPercent,
    dailyGoalReached,
    levelTitle,
    nextLevelXp,
    levelProgress,
    overdueCount,
    overduePrefix,
    nextScheduledReview,
  } = useHomeDashboard({
    vocabulary,
    studyReady,
    cardStates: state.cardStates,
    studyDays: state.studyDays,
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
    cardStates: state.cardStates,
    today,
    dailyGoal: state.settings.dailyGoal,
    cardsStudiedToday,
    dailyGoalReached,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100">
      <HomeHeader
        level={state.stats.level}
        levelTitle={levelTitle}
        levelProgress={levelProgress}
        streak={state.stats.streak}
        totalXp={state.stats.totalXp}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <SaveAlerts saveBlocked={saveBlocked} saveError={saveError} />

        <WelcomeCard
          cardsRemaining={cardsRemaining}
          plannedCards={plannedCards}
          overduePrefix={overduePrefix}
          dailyGoalReached={dailyGoalReached}
          onStartSession={startSession}
        />

        <ProgressCards
          cardsStudiedToday={cardsStudiedToday}
          dailyGoal={state.settings.dailyGoal}
          newCardsPerDay={state.settings.newCardsPerDay}
          progressPercent={progressPercent}
          level={state.stats.level}
          levelTitle={levelTitle}
          levelProgress={levelProgress}
          totalXp={state.stats.totalXp}
          nextLevelXp={nextLevelXp}
          totalCardsLearned={state.stats.totalCardsLearned}
          studyReadyCount={studyReady.length}
        />

        <ReviewPlanCard
          today={today}
          overdueCount={overdueCount}
          nextScheduledReview={nextScheduledReview}
          forecast={reviewForecast}
          forecastPeak={forecastPeak}
          workloadStatus={workloadStatus}
          onStartSession={startSession}
        />

        <PracticeMenu
          weakCardCount={weakCards.length}
          learningCardCount={learningCards.length}
          onOpenAlphabet={() => setShowAlphabet(true)}
          onOpenListening={() =>
            openRecognitionPractice(() => setShowListening(true))
          }
          onOpenScenarios={() =>
            openRecognitionPractice(() => setShowScenarios(true))
          }
          onOpenShadowing={() => setShowShadowing(true)}
          onStartWeakSession={startWeakSession}
          onStartLearningSession={startLearningSession}
        />

        <QuickLinks
          onOpenBrowse={() => setShowBrowse(true)}
          onOpenStats={() => setShowStats(true)}
        />

        <CategoryGrid
          categories={categoryMastery}
          vocabularyCount={vocabulary.length}
          onViewAll={() => {
            setBrowseCategory(null);
            setShowBrowse(true);
          }}
          onSelectCategory={categoryId => {
            setBrowseCategory(categoryId);
            setShowBrowse(true);
          }}
        />
      </main>

      <HomeDialogs
        today={today}
        state={state}
        updateSettings={updateSettings}
        replaceState={replaceState}
        isStudying={isStudying}
        sessionQueue={sessionQueue}
        sessionMode={sessionMode}
        dailyGoalReached={dailyGoalReached}
        onGrade={handleGrade}
        onCloseSession={closeSession}
        recognitionCards={recognitionSessionCards}
        studyReady={studyReady}
        onListeningGrade={handleListeningGrade}
        onScenarioGrade={handleScenarioGrade}
        onShadowingGrade={handleShadowingGrade}
        showAlphabet={showAlphabet}
        showListening={showListening}
        showScenarios={showScenarios}
        showShadowing={showShadowing}
        onCloseAlphabet={() => setShowAlphabet(false)}
        onCloseListening={() => setShowListening(false)}
        onCloseScenarios={() => setShowScenarios(false)}
        onCloseShadowing={() => setShowShadowing(false)}
        showBrowse={showBrowse}
        browseCategory={browseCategory}
        vocabulary={vocabulary}
        onBrowseOpenChange={setShowBrowse}
        showStats={showStats}
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
        onStatsOpenChange={setShowStats}
        showSettings={showSettings}
        onSettingsOpenChange={setShowSettings}
      />
    </div>
  );
}

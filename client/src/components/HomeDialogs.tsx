import { lazy, Suspense } from "react";
import { StudySession } from "@/components/StudySession";
import { LazyBoundary } from "@/components/LazyBoundary";
import type {
  StatsDialogForecast,
  StatsDialogStats,
} from "@/components/StatsDialog";
import type { UserState } from "@/hooks/useStudyState";
import type { SessionMode } from "@/hooks/useHomeSessions";
import type { VocabularyCard } from "@/lib/vocabulary";
import type { GrammarProgress } from "@/lib/grammarProgress";

// Practice modes and dialogs stay lazily loaded so the initial bundle stays
// focused on the Daily Session flow.
const AlphabetPractice = lazy(() =>
  import("@/pages/AlphabetPractice").then(module => ({
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
const BrowseDialog = lazy(() =>
  import("@/components/BrowseDialog").then(module => ({
    default: module.BrowseDialog,
  }))
);
const SettingsDialog = lazy(() =>
  import("@/components/SettingsDialog").then(module => ({
    default: module.SettingsDialog,
  }))
);
const StatsDialog = lazy(() =>
  import("@/components/StatsDialog").then(module => ({
    default: module.StatsDialog,
  }))
);
const GrammarDialog = lazy(() =>
  import("@/components/grammar/GrammarDialog").then(module => ({
    default: module.GrammarDialog,
  }))
);

function ModalLoadingFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading practice mode"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 dark:border-emerald-800/70 border-t-emerald-600" />
    </div>
  );
}

interface HomeDialogsProps {
  today: string;
  state: UserState;
  updateSettings: (settings: Partial<UserState["settings"]>) => void;
  replaceState: (state: UserState) => void;

  isStudying: boolean;
  sessionQueue: VocabularyCard[];
  sessionMode: SessionMode;
  dailyGoalReached: boolean;
  onGrade: (
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: { responseTimeMs?: number }
  ) => void;
  onCloseSession: () => void;

  recognitionCards: VocabularyCard[];
  studyReady: VocabularyCard[];
  onListeningGrade: (cardId: string, rating: "again" | "good") => void;
  onScenarioGrade: (cardId: string, rating: "again" | "good") => void;
  onShadowingGrade: (cardId: string, rating: "again" | "good") => void;

  showAlphabet: boolean;
  showGrammar: boolean;
  grammarProgress: GrammarProgress;
  onGrammarComplete: (lessonId: string, correct: number, total: number) => void;
  showListening: boolean;
  showScenarios: boolean;
  showShadowing: boolean;
  onCloseAlphabet: () => void;
  onCloseGrammar: () => void;
  onCloseListening: () => void;
  onCloseScenarios: () => void;
  onCloseShadowing: () => void;

  showBrowse: boolean;
  browseCategory: string | null;
  vocabulary: VocabularyCard[];
  onBrowseOpenChange: (open: boolean) => void;

  showStats: boolean;
  stats: StatsDialogStats;
  forecast: StatsDialogForecast;
  onStatsOpenChange: (open: boolean) => void;

  showSettings: boolean;
  onSettingsOpenChange: (open: boolean) => void;
}

/** Every modal the dashboard can open. Kept lazy so none load on first paint. */
export function HomeDialogs({
  today,
  state,
  updateSettings,
  replaceState,
  isStudying,
  sessionQueue,
  sessionMode,
  dailyGoalReached,
  onGrade,
  onCloseSession,
  recognitionCards,
  studyReady,
  onListeningGrade,
  onScenarioGrade,
  onShadowingGrade,
  showAlphabet,
  showGrammar,
  grammarProgress,
  onGrammarComplete,
  showListening,
  showScenarios,
  showShadowing,
  onCloseAlphabet,
  onCloseGrammar,
  onCloseListening,
  onCloseScenarios,
  onCloseShadowing,
  showBrowse,
  browseCategory,
  vocabulary,
  onBrowseOpenChange,
  showStats,
  stats,
  forecast,
  onStatsOpenChange,
  showSettings,
  onSettingsOpenChange,
}: HomeDialogsProps) {
  return (
    <>
      {/* Study Session Modal */}
      {isStudying && sessionQueue.length > 0 && (
        <StudySession
          queue={sessionQueue}
          cardStates={state.cardStates}
          onGrade={onGrade}
          onClose={onCloseSession}
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
          <LazyBoundary onClose={onCloseAlphabet}>
            <AlphabetPractice onClose={onCloseAlphabet} />
          </LazyBoundary>
        </Suspense>
      )}

      {showGrammar && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={onCloseGrammar}>
            <GrammarDialog
              open
              onOpenChange={open => {
                if (!open) onCloseGrammar();
              }}
              progress={grammarProgress}
              onCompleteLesson={onGrammarComplete}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {showListening && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={onCloseListening}>
            <ListeningPractice
              cards={recognitionCards}
              onGrade={onListeningGrade}
              onClose={onCloseListening}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {showScenarios && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={onCloseScenarios}>
            <ScenarioPractice
              cards={recognitionCards}
              onGrade={onScenarioGrade}
              onClose={onCloseScenarios}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {showShadowing && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={onCloseShadowing}>
            <ShadowingPractice
              cards={studyReady}
              onGrade={onShadowingGrade}
              onClose={onCloseShadowing}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {/* Browse Dialog */}
      {showBrowse && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => onBrowseOpenChange(false)}>
            <BrowseDialog
              open
              onOpenChange={onBrowseOpenChange}
              initialCategory={browseCategory}
              vocabulary={vocabulary}
              cardStates={state.cardStates}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {/* Stats Dialog */}
      {showStats && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => onStatsOpenChange(false)}>
            <StatsDialog
              open
              onOpenChange={onStatsOpenChange}
              today={today}
              stats={stats}
              forecast={forecast}
            />
          </LazyBoundary>
        </Suspense>
      )}

      {/* Settings Dialog */}
      {showSettings && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LazyBoundary onClose={() => onSettingsOpenChange(false)}>
            <SettingsDialog
              open
              onOpenChange={onSettingsOpenChange}
              state={state}
              updateSettings={updateSettings}
              replaceState={replaceState}
              today={today}
            />
          </LazyBoundary>
        </Suspense>
      )}
    </>
  );
}

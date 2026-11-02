import { lazy, Suspense, type ReactNode } from "react";
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
import { knownDialogKind, type ActiveDialog } from "@/lib/dialogLauncher";

// Every dialog and practice mode stays lazily loaded so the initial bundle
// stays focused on the Daily Session flow.
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

/** Keeps the Suspense and chunk-failure boundary around every lazy dialog. */
function LazyModal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <LazyBoundary onClose={onClose}>{children}</LazyBoundary>
    </Suspense>
  );
}

/**
 * Everything a dialog may need, assembled once by Home. The host's entries pull
 * only their own fields, so a mode's wiring no longer travels through the page.
 */
export interface HomeDialogDeps {
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

  grammarProgress: GrammarProgress;
  onGrammarComplete: (lessonId: string, correct: number, total: number) => void;

  vocabulary: VocabularyCard[];
  stats: StatsDialogStats;
  forecast: StatsDialogForecast;
}

interface HomeDialogHostProps {
  dialog: ActiveDialog;
  onClose: () => void;
  deps: HomeDialogDeps;
}

/**
 * Mounts the one dialog Home requested. Each entry owns its child's wiring and
 * stays lazy; an absent or unknown request mounts nothing.
 */
export function HomeDialogHost({ dialog, onClose, deps }: HomeDialogHostProps) {
  return (
    <>
      {/* Study Session Modal */}
      {deps.isStudying && deps.sessionQueue.length > 0 && (
        <StudySession
          queue={deps.sessionQueue}
          cardStates={deps.state.cardStates}
          onGrade={deps.onGrade}
          onClose={deps.onCloseSession}
          allowRepeat={
            deps.dailyGoalReached ||
            deps.sessionMode === "weak" ||
            deps.sessionMode === "learning"
          }
          autoPlayAudio={deps.state.settings.autoPlayAudio}
          title={
            deps.sessionMode === "weak"
              ? "Weak Words"
              : deps.sessionMode === "learning"
                ? "Learning Review"
                : "Daily Session"
          }
        />
      )}

      <RequestedDialog dialog={dialog} onClose={onClose} deps={deps} />
    </>
  );
}

function RequestedDialog({
  dialog,
  onClose,
  deps,
}: {
  dialog: ActiveDialog;
  onClose: () => void;
  deps: HomeDialogDeps;
}) {
  // Also guards a request whose kind is not in this build; it renders nothing.
  if (knownDialogKind(dialog) === null || !dialog) return null;

  switch (dialog.kind) {
    case "alphabet":
      return (
        <LazyModal onClose={onClose}>
          <AlphabetPractice onClose={onClose} />
        </LazyModal>
      );

    case "grammar":
      return (
        <LazyModal onClose={onClose}>
          <GrammarDialog
            open
            onOpenChange={open => {
              if (!open) onClose();
            }}
            progress={deps.grammarProgress}
            onCompleteLesson={deps.onGrammarComplete}
          />
        </LazyModal>
      );

    case "listening":
      return (
        <LazyModal onClose={onClose}>
          <ListeningPractice
            cards={deps.recognitionCards}
            onGrade={deps.onListeningGrade}
            onClose={onClose}
          />
        </LazyModal>
      );

    case "scenario":
      return (
        <LazyModal onClose={onClose}>
          <ScenarioPractice
            cards={deps.recognitionCards}
            onGrade={deps.onScenarioGrade}
            onClose={onClose}
          />
        </LazyModal>
      );

    case "shadowing":
      return (
        <LazyModal onClose={onClose}>
          <ShadowingPractice
            cards={deps.studyReady}
            onGrade={deps.onShadowingGrade}
            onClose={onClose}
          />
        </LazyModal>
      );

    case "browse":
      return (
        <LazyModal onClose={onClose}>
          <BrowseDialog
            open
            onOpenChange={open => {
              if (!open) onClose();
            }}
            initialCategory={dialog.category}
            vocabulary={deps.vocabulary}
            cardStates={deps.state.cardStates}
          />
        </LazyModal>
      );

    case "stats":
      return (
        <LazyModal onClose={onClose}>
          <StatsDialog
            open
            onOpenChange={open => {
              if (!open) onClose();
            }}
            today={deps.today}
            stats={deps.stats}
            forecast={deps.forecast}
          />
        </LazyModal>
      );

    case "settings":
      return (
        <LazyModal onClose={onClose}>
          <SettingsDialog
            open
            onOpenChange={open => {
              if (!open) onClose();
            }}
            state={deps.state}
            updateSettings={deps.updateSettings}
            replaceState={deps.replaceState}
            today={deps.today}
          />
        </LazyModal>
      );

    default:
      return null;
  }
}

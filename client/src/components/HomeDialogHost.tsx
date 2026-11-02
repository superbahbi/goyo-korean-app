import { Suspense, type ReactNode } from "react";
import { StudySession } from "@/components/StudySession";
import { LazyBoundary } from "@/components/LazyBoundary";
import {
  DIALOG_REGISTRY,
  type HomeDialogDeps,
} from "@/components/dialogs/registry";
import type { SessionMode } from "@/hooks/useHomeSessions";
import type { VocabularyCard } from "@/lib/vocabulary";
import type { ActiveDialog } from "@/lib/dialogLauncher";
import { repeatableSession } from "@/lib/gradeIntent";

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
 * The study session's own wiring. It is deliberately not a dialog kind: it is a
 * full practice run mounted outside the launcher, so a grade cannot be replaced
 * by opening another dashboard dialog. This is the one documented exception.
 */
export interface StudySessionDeps {
  isStudying: boolean;
  queue: VocabularyCard[];
  mode: SessionMode;
  dailyGoalReached: boolean;
  onGrade: (
    cardId: string,
    rating: "again" | "good" | "easy",
    options?: { responseTimeMs?: number }
  ) => void;
  onClose: () => void;
}

interface HomeDialogHostProps {
  dialog: ActiveDialog;
  onClose: () => void;
  deps: HomeDialogDeps;
  study: StudySessionDeps;
}

/**
 * Mounts the one dialog Home requested. Each entry owns its child's wiring and
 * stays lazy; an absent request mounts nothing.
 */
export function HomeDialogHost({
  dialog,
  onClose,
  deps,
  study,
}: HomeDialogHostProps) {
  const entry = dialog ? DIALOG_REGISTRY[dialog.kind] : null;

  return (
    <>
      {/* Study Session Modal — the documented exception to the dialog registry. */}
      {study.isStudying && study.queue.length > 0 && (
        <StudySession
          queue={study.queue}
          cardStates={deps.state.cardStates}
          onGrade={study.onGrade}
          onClose={study.onClose}
          allowRepeat={repeatableSession(study.mode, study.dailyGoalReached)}
          autoPlayAudio={deps.state.settings.autoPlayAudio}
          title={
            study.mode === "weak"
              ? "Weak Words"
              : study.mode === "learning"
                ? "Learning Review"
                : "Daily Session"
          }
        />
      )}

      {dialog && entry && (
        <LazyModal onClose={onClose}>
          {entry.render(dialog, deps, onClose)}
        </LazyModal>
      )}
    </>
  );
}

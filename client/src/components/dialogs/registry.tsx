import { lazy, type ReactNode } from "react";
import type { UserState } from "@/lib/savedState";
import type { DialogKind, DialogRequest } from "@/lib/dialogLauncher";
import type { GrammarProgress } from "@/lib/grammarProgress";
import type { VocabularyCard } from "@/lib/vocabulary";
import type {
  StatsDialogForecast,
  StatsDialogStats,
} from "@/components/stats/types";

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

/**
 * The narrow contracts each dialog may read. Grouping the assembly by concern
 * keeps a dialog from depending on the whole dashboard.
 */
export interface HomeDialogDeps {
  today: string;
  state: UserState;
  settings: {
    updateSettings: (settings: Partial<UserState["settings"]>) => void;
    replaceState: (state: UserState) => void;
  };
  grammar: {
    progress: GrammarProgress;
    onComplete: (lessonId: string, correct: number, total: number) => void;
  };
  recognition: {
    cards: VocabularyCard[];
    onListeningGrade: (cardId: string, rating: "again" | "good") => void;
    onScenarioGrade: (cardId: string, rating: "again" | "good") => void;
  };
  shadowing: {
    cards: VocabularyCard[];
    onGrade: (cardId: string, rating: "again" | "good") => void;
  };
  browse: {
    vocabulary: VocabularyCard[];
  };
  stats: StatsDialogStats;
  forecast: StatsDialogForecast;
}

export interface DialogEntry {
  render: (
    dialog: DialogRequest,
    deps: HomeDialogDeps,
    onClose: () => void
  ) => ReactNode;
}

/**
 * One registry keyed by kind. The Record makes a missing dialog a compile
 * error, and dispatch is a lookup rather than a switch with a silent default.
 * Each entry renders its own lazy component and reads only its narrow deps.
 */
export const DIALOG_REGISTRY: Record<DialogKind, DialogEntry> = {
  alphabet: {
    render: (_dialog, _deps, onClose) => <AlphabetPractice onClose={onClose} />,
  },
  grammar: {
    render: (_dialog, deps, onClose) => (
      <GrammarDialog
        open
        onOpenChange={open => {
          if (!open) onClose();
        }}
        progress={deps.grammar.progress}
        onCompleteLesson={deps.grammar.onComplete}
      />
    ),
  },
  listening: {
    render: (_dialog, deps, onClose) => (
      <ListeningPractice
        cards={deps.recognition.cards}
        onGrade={deps.recognition.onListeningGrade}
        onClose={onClose}
      />
    ),
  },
  scenario: {
    render: (_dialog, deps, onClose) => (
      <ScenarioPractice
        cards={deps.recognition.cards}
        onGrade={deps.recognition.onScenarioGrade}
        onClose={onClose}
      />
    ),
  },
  shadowing: {
    render: (_dialog, deps, onClose) => (
      <ShadowingPractice
        cards={deps.shadowing.cards}
        onGrade={deps.shadowing.onGrade}
        onClose={onClose}
      />
    ),
  },
  browse: {
    render: (dialog, deps, onClose) =>
      dialog.kind === "browse" ? (
        <BrowseDialog
          open
          onOpenChange={open => {
            if (!open) onClose();
          }}
          initialCategory={dialog.category}
          vocabulary={deps.browse.vocabulary}
          cardStates={deps.state.cardStates}
        />
      ) : null,
  },
  stats: {
    render: (_dialog, deps, onClose) => (
      <StatsDialog
        open
        onOpenChange={open => {
          if (!open) onClose();
        }}
        today={deps.today}
        stats={deps.stats}
        forecast={deps.forecast}
      />
    ),
  },
  settings: {
    render: (_dialog, deps, onClose) => (
      <SettingsDialog
        open
        onOpenChange={open => {
          if (!open) onClose();
        }}
        state={deps.state}
        updateSettings={deps.settings.updateSettings}
        replaceState={deps.settings.replaceState}
        today={deps.today}
      />
    ),
  },
};

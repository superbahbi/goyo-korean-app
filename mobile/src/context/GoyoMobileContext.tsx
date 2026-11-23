import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SCENARIOS } from "../../../client/src/components/practice/scenarios";
import {
  setAudioSpeaker,
  stopAudio,
} from "../../../client/src/lib/audioPlayer";
import {
  buildDashboardView,
  type DashboardView,
} from "../../../client/src/lib/dashboardView";
import { getLocalDateKey } from "../../../client/src/lib/day";
import {
  NO_DIALOG,
  reduceDialog,
  type ActiveDialog,
  type DialogRequestInput,
} from "../../../client/src/lib/dialogLauncher";
import {
  applyGradeOutcome,
  type GradeOptions,
  type GradeOutcome,
} from "../../../client/src/lib/gradeOutcome";
import { recordGrammarAttempt } from "../../../client/src/lib/grammarProgress";
import { PROGRESS_STORAGE_KEY } from "../../../client/src/lib/progressStorage";
import { THEME_STORAGE_KEY } from "../../../shared/theme";
import {
  loadSavedState,
  parseSavedState,
  type UserSettings,
  type UserState,
} from "../../../client/src/lib/savedState";
import {
  CURATED_CARDS,
  CURATED_STUDY_READY,
  loadVocabularyDeck,
  type VocabularyCard,
  type VocabularyDeck,
} from "../../../client/src/lib/vocabulary";

/**
 * One provider for the React Native app (iOS, Android, Web). It composes the
 * exact domain modules the web app uses, so progress, scheduling, and grading
 * stay identical across platforms.
 */

export type Theme = "light" | "dark";
export type SessionMode = "daily" | "weak" | "learning";
type Rating = "again" | "good" | "easy";

export interface GoyoMobileContextValue {
  state: UserState;
  today: string;
  vocabulary: VocabularyCard[];
  studyReady: VocabularyCard[];
  view: DashboardView;
  activeDialog: ActiveDialog;
  isStudying: boolean;
  sessionQueue: VocabularyCard[];
  sessionMode: SessionMode;
  recognitionSessionCards: VocabularyCard[];
  theme: Theme;
  notice: string | null;
  startDailySession: () => void;
  startWeakSession: () => void;
  startLearningSession: () => void;
  closeStudySession: () => void;
  handleStudyGrade: (
    cardId: string,
    rating: Rating,
    options?: GradeOptions
  ) => GradeOutcome;
  openDialog: (request: DialogRequestInput) => void;
  closeDialog: () => void;
  openBrowse: (category?: string | null) => void;
  openListening: () => void;
  openScenario: () => void;
  openShadowing: () => void;
  handleListeningGrade: (cardId: string, rating: Rating) => void;
  handleScenarioGrade: (cardId: string, rating: Rating) => void;
  handleShadowingGrade: (cardId: string, rating: Rating) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  recordGrammarResult: (
    lessonId: string,
    correct: number,
    total: number
  ) => void;
  replaceState: (next: UserState) => void;
  resetProgress: () => void;
  toggleTheme: () => void;
  dismissNotice: () => void;
}

const GoyoMobileContext = createContext<GoyoMobileContextValue | null>(null);
const SCENARIO_CARD_IDS = SCENARIOS.map(scenario => scenario.cardId);

function labelDate(key: string, style: "weekday" | "monthDay"): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString(
    undefined,
    style === "weekday"
      ? { weekday: "short" }
      : { month: "short", day: "numeric" }
  );
}

function readInitialState(): { state: UserState; blocked: boolean } {
  try {
    if (typeof localStorage === "undefined") {
      return { state: parseSavedState(null), blocked: false };
    }
    const loaded = loadSavedState(localStorage.getItem(PROGRESS_STORAGE_KEY));
    return { state: loaded.state, blocked: loaded.blockedByNewerVersion };
  } catch {
    return { state: parseSavedState(null), blocked: false };
  }
}

function readStoredTheme(): Theme {
  try {
    if (typeof localStorage === "undefined") return "light";
    // The web app may store "system"; the mobile app models only an explicit
    // light/dark choice, so anything but "dark" falls back to light.
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function GoyoMobileProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialState);
  const [state, setState] = useState<UserState>(initial.state);
  const [saveBlocked, setSaveBlocked] = useState(initial.blocked);
  // Grades in one tick must build on the newest state, not a stale render.
  const stateRef = useRef(state);
  stateRef.current = state;

  const [today, setToday] = useState(getLocalDateKey);
  const [deck, setDeck] = useState<VocabularyDeck>({
    vocabulary: CURATED_CARDS,
    studyReady: CURATED_STUDY_READY,
  });
  const [activeDialog, dispatchDialog] = useReducer(reduceDialog, NO_DIALOG);
  const [isStudying, setIsStudying] = useState(false);
  const [sessionQueue, setSessionQueue] = useState<VocabularyCard[]>([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>("daily");
  const [recognitionSessionCards, setRecognitionSessionCards] = useState<
    VocabularyCard[]
  >([]);
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [notice, setNotice] = useState<string | null>(null);

  // Native environments may have no localStorage: in-memory state still works.
  useEffect(() => {
    if (saveBlocked || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save mobile progress:", error);
    }
  }, [state, saveBlocked]);

  // Native environments may have no localStorage: in-memory choice still works.
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Persisting is best effort; the in-memory choice still applies.
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    loadVocabularyDeck()
      .then(loaded => {
        if (active) setDeck(loaded);
      })
      .catch(error =>
        console.error("Failed to load the vocabulary deck:", error)
      );
    return () => {
      active = false;
    };
  }, []);

  // Roll the dashboard over at midnight, or as soon as the app wakes.
  useEffect(() => {
    const sync = () => setToday(getLocalDateKey());
    const timer = setInterval(sync, 60_000);
    if (typeof document !== "undefined")
      document.addEventListener("visibilitychange", sync);
    if (typeof window !== "undefined") window.addEventListener("focus", sync);
    return () => {
      clearInterval(timer);
      if (typeof document !== "undefined")
        document.removeEventListener("visibilitychange", sync);
      if (typeof window !== "undefined")
        window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    setAudioSpeaker(state.settings.audioSpeaker);
  }, [state.settings.audioSpeaker]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4_000);
    return () => clearTimeout(timer);
  }, [notice]);

  const view = useMemo(
    () =>
      buildDashboardView({
        vocabulary: deck.vocabulary,
        studyReady: deck.studyReady,
        cardStates: state.cardStates,
        studyDays: state.studyDays,
        reviewEntries: state.reviewLog.entries.length,
        today,
        dailyGoal: state.settings.dailyGoal,
        newCardsPerDay: state.settings.newCardsPerDay,
        level: state.stats.level,
        totalXp: state.stats.totalXp,
        streak: state.stats.streak,
        scenarioCardIds: SCENARIO_CARD_IDS,
        labelDate,
      }),
    [deck, state, today]
  );

  const gradeCard = useCallback(
    (cardId: string, rating: Rating, options?: GradeOptions): GradeOutcome => {
      const result = applyGradeOutcome(
        stateRef.current,
        cardId,
        rating,
        options
      );
      stateRef.current = result.state;
      setState(result.state);
      if (result.outcome.goalJustReached)
        setNotice(`Daily goal reached! +${result.outcome.xp} XP 🎉`);
      return result.outcome;
    },
    []
  );

  const startDailySession = useCallback(() => {
    if (!view.modes.daily.available)
      return setNotice(
        "Your planned reviews are complete. New words resume tomorrow."
      );
    setSessionQueue([...view.pools.queue]);
    setSessionMode("daily");
    setIsStudying(true);
  }, [view]);

  const startWeakSession = useCallback(() => {
    if (!view.modes.weak.available)
      return setNotice("Review a few cards first to unlock Weak Words.");
    setSessionQueue(view.pools.weakCards);
    setSessionMode("weak");
    setIsStudying(true);
  }, [view]);

  const startLearningSession = useCallback(() => {
    if (!view.modes.learning.available)
      return setNotice(
        "No Learning or Shaky cards yet. Start a daily session first."
      );
    setSessionQueue(view.pools.learningCards);
    setSessionMode("learning");
    setIsStudying(true);
  }, [view]);

  const closeStudySession = useCallback(() => {
    setIsStudying(false);
    setSessionQueue([]);
    stopAudio();
  }, []);

  const handleStudyGrade = useCallback(
    (cardId: string, rating: Rating, options?: GradeOptions) =>
      gradeCard(cardId, rating, {
        responseTimeMs: options?.responseTimeMs,
        mode: sessionMode,
      }),
    [gradeCard, sessionMode]
  );

  const openDialog = useCallback((request: DialogRequestInput) => {
    dispatchDialog({ type: "open", request });
  }, []);
  const closeDialog = useCallback(() => dispatchDialog({ type: "close" }), []);
  const openBrowse = useCallback(
    (category: string | null = null) =>
      openDialog({ kind: "browse", category }),
    [openDialog]
  );

  const openRecognition = useCallback(
    (kind: "listening" | "scenario") => {
      if (view.modes[kind].reason === "too-few-reviewed-cards")
        return setNotice(
          "Study a few cards first. Listening and scenarios use cards you have already reviewed."
        );
      setRecognitionSessionCards(view.pools.recognitionCards);
      openDialog({ kind });
    },
    [openDialog, view]
  );

  const openListening = useCallback(
    () => openRecognition("listening"),
    [openRecognition]
  );
  const openScenario = useCallback(
    () => openRecognition("scenario"),
    [openRecognition]
  );
  const openShadowing = useCallback(
    () => openDialog({ kind: "shadowing" }),
    [openDialog]
  );

  const handleListeningGrade = useCallback(
    (cardId: string, rating: Rating) => {
      gradeCard(cardId, rating, { mode: "listening" });
    },
    [gradeCard]
  );
  const handleScenarioGrade = useCallback(
    (cardId: string, rating: Rating) => {
      gradeCard(cardId, rating, { mode: "scenario" });
    },
    [gradeCard]
  );
  const handleShadowingGrade = useCallback(
    (cardId: string, rating: Rating) => {
      gradeCard(cardId, rating, { mode: "shadowing" });
    },
    [gradeCard]
  );

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setState(current => {
      const next: UserState = {
        ...current,
        settings: { ...current.settings, ...partial },
      };
      stateRef.current = next;
      return next;
    });
  }, []);

  const recordGrammarResult = useCallback(
    (lessonId: string, correct: number, total: number) => {
      setState(current => {
        const next: UserState = {
          ...current,
          grammar: recordGrammarAttempt(
            current.grammar,
            lessonId,
            correct,
            total
          ),
        };
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  const replaceState = useCallback((next: UserState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const resetProgress = useCallback(() => {
    try {
      if (typeof localStorage !== "undefined")
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {
      // Clearing storage is best effort; the reset still applies in memory.
    }
    const next = parseSavedState(null, today);
    stateRef.current = next;
    setState(next);
    setSaveBlocked(false);
    setNotice("Progress reset. A fresh start!");
  }, [today]);

  const toggleTheme = useCallback(
    () => setTheme(current => (current === "dark" ? "light" : "dark")),
    []
  );
  const dismissNotice = useCallback(() => setNotice(null), []);

  const value: GoyoMobileContextValue = {
    state,
    today,
    vocabulary: deck.vocabulary,
    studyReady: deck.studyReady,
    view,
    activeDialog,
    isStudying,
    sessionQueue,
    sessionMode,
    recognitionSessionCards,
    theme,
    notice,
    startDailySession,
    startWeakSession,
    startLearningSession,
    closeStudySession,
    handleStudyGrade,
    openDialog,
    closeDialog,
    openBrowse,
    openListening,
    openScenario,
    openShadowing,
    handleListeningGrade,
    handleScenarioGrade,
    handleShadowingGrade,
    updateSettings,
    recordGrammarResult,
    replaceState,
    resetProgress,
    toggleTheme,
    dismissNotice,
  };
  return (
    <GoyoMobileContext.Provider value={value}>
      {children}
    </GoyoMobileContext.Provider>
  );
}

export function useGoyoMobile(): GoyoMobileContextValue {
  const context = useContext(GoyoMobileContext);
  if (!context)
    throw new Error("useGoyoMobile must be used within GoyoMobileProvider");
  return context;
}

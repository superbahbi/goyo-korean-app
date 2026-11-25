import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { SCENARIOS } from "../../../apps/web/src/components/practice/scenarios";
import {
  setAudioSpeaker,
  stopAudio,
} from "../../../packages/domain/src/audioPlayer";
import {
  buildDashboardView,
  type DashboardView,
} from "../../../packages/domain/src/dashboardView";
import { getLocalDateKey } from "../../../packages/domain/src/day";
import {
  NO_DIALOG,
  reduceDialog,
  type ActiveDialog,
  type DialogRequestInput,
} from "../../../packages/domain/src/dialogLauncher";
import type {
  GradeOptions,
  GradeOutcome,
} from "../../../packages/domain/src/gradeOutcome";
import type {
  UserSettings,
  UserState,
} from "../../../packages/domain/src/savedState";
import {
  CURATED_CARDS,
  CURATED_STUDY_READY,
  loadVocabularyDeck,
  type VocabularyCard,
  type VocabularyDeck,
} from "../../../packages/domain/src/vocabulary";
import {
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "../../../packages/shared/theme";
import { createCrossPlatformProgressStore } from "../../../packages/shared/storage";

/**
 * One provider for the mobile app (the `/mobile` DOM screens served to
 * browsers and the iOS WKWebView shell). It composes the exact domain
 * modules the web app uses, so progress, scheduling, and grading stay
 * identical across surfaces.
 */

/** The theme actually painted: "system" has already been resolved. */
export type Theme = "light" | "dark";
export type SessionMode = "daily" | "weak" | "learning";
type Rating = "again" | "good" | "easy";

const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)";

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
  /** The resolved theme the screens should paint. */
  theme: Theme;
  /** The stored choice, including "system"; shared with the web app. */
  themePreference: ThemePreference;
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
  setThemePreference: (preference: ThemePreference) => void;
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

/**
 * The stored theme choice, in the same "system" | "light" | "dark" domain
 * the web app persists: a web-set "system" preference survives a mobile
 * visit, and anything unreadable falls back to "system".
 */
function readStoredTheme(): ThemePreference {
  try {
    if (typeof localStorage === "undefined") return "system";
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "system" || stored === "light" || stored === "dark")
      return stored;
    return "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(PREFERS_DARK_QUERY).matches;
}

export function GoyoMobileProvider({ children }: { children: ReactNode }) {
  // The store owns the saved-progress seam: hydration, the newer-save
  // guard, and save errors. React only mirrors its state.
  const [store] = useState(() => createCrossPlatformProgressStore());
  const [state, setState] = useState<UserState>(() => store.getState());
  useEffect(() => store.subscribe(() => setState(store.getState())), [store]);

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
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(readStoredTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const [notice, setNotice] = useState<string | null>(null);

  // Persist the full preference domain, "system" included, so the web app
  // reads back exactly what the learner chose.
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    } catch {
      // Persisting is best effort; the in-memory choice still applies.
    }
  }, [themePreference]);

  // A "system" preference follows the OS, including while the app is open.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(PREFERS_DARK_QUERY);
    const sync = () => setSystemDark(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

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

  const theme: Theme =
    themePreference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : themePreference;

  // public/theme-init.js paints the document before React; keep it in step
  // when the learner changes the theme here, so the status bar, overscroll
  // area and native controls follow the screens.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0a1311" : "#f5f8f6");
  }, [theme]);

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
        scenarioCardIds: SCENARIO_CARD_IDS,
        labelDate,
      }),
    [deck, state, today]
  );

  // The store always grades from its own newest state, so several Grades in
  // one tick compose instead of overwriting each other.
  const gradeCard = useCallback(
    (cardId: string, rating: Rating, options?: GradeOptions): GradeOutcome => {
      const outcome = store.gradeCard(cardId, rating, options);
      if (outcome.goalJustReached)
        setNotice(`Daily goal reached! +${outcome.xp} XP 🎉`);
      return outcome;
    },
    [store]
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
  // Every sheet closes through here (its close button, the backdrop, Escape),
  // so no practice clip or Browse pronunciation outlives its screen.
  const closeDialog = useCallback(() => {
    stopAudio();
    dispatchDialog({ type: "close" });
  }, []);
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

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => store.updateSettings(partial),
    [store]
  );

  const recordGrammarResult = useCallback(
    (lessonId: string, correct: number, total: number) =>
      store.recordGrammarResult(lessonId, correct, total),
    [store]
  );

  const replaceState = useCallback(
    (next: UserState) => store.replaceState(next),
    [store]
  );

  const resetProgress = useCallback(() => {
    // The store clears the key, resets to a fresh state, and notifies; a
    // newer-save block lifts with it.
    void store.resetProgress();
    setNotice("Progress reset. A fresh start!");
  }, [store]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
  }, []);

  // The dashboard's quick toggle flips the resolved theme, which stores an
  // explicit choice — the same trade the web header toggle makes.
  const toggleTheme = useCallback(() => {
    setThemePreferenceState(theme === "dark" ? "light" : "dark");
  }, [theme]);
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
    themePreference,
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
    setThemePreference,
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

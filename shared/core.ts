/**
 * Canonical, framework-free domain entry point shared by the Web client
 * (`client/`) and the React Native app (`mobile/`).
 *
 * Everything re-exported here is pure data, types, or state logic with no
 * React, DOM, or React Native dependency. Platform adapters (storage, audio,
 * theme) live beside this file and build on these modules.
 *
 * The names below mirror the real exports in `client/src/lib/*`; where the
 * shared API favours a shorter name, an alias is exported next to the original
 * so both call sites stay readable.
 */

import { SCENARIOS } from "../client/src/components/practice/scenarios";
import { parseSavedState } from "../client/src/lib/savedState";
import type { UserState } from "../client/src/lib/savedState";
import { xpToReachLevel } from "../client/src/lib/xp";

// --- Vocabulary -----------------------------------------------------------

export {
  CATEGORIES,
  CURATED_CARDS,
  CURATED_STUDY_READY,
  loadVocabularyDeck,
} from "../client/src/lib/vocabulary";
export type {
  VocabularyCard,
  VocabularyDeck,
} from "../client/src/lib/vocabulary";

// --- Alphabet -------------------------------------------------------------

export {
  ALPHABET_CARD_LOOKUP,
  ALPHABET_CATEGORIES,
  ALPHABET_CATEGORY_DESCRIPTIONS,
  ALPHABET_CONSONANT_CARDS,
  ALPHABET_CONSONANT_TOTAL,
  ALPHABET_COUNTS,
  ALPHABET_DATA,
  ALPHABET_DATASET_IS_COMPLETE,
  ALPHABET_FULL_INVENTORY_LABEL,
  ALPHABET_LEARNING_NOTE,
  ALPHABET_TOTAL,
  ALPHABET_VOWEL_CARDS,
  ALPHABET_VOWEL_TOTAL,
  getAlphabetAudioText,
  getAlphabetCardCount,
  getAlphabetCards,
  getAlphabetCategoryCards,
} from "../client/src/lib/alphabet";
export type {
  AlphabetCard,
  AlphabetCard as HangulCharacter,
  AlphabetCategory,
  AlphabetCategoryId,
} from "../client/src/lib/alphabet";

// --- Hangul stroke order --------------------------------------------------

export {
  HANGUL_STROKE_ORDER,
  getHangulStrokes,
  hasHangulStrokes,
} from "../client/src/lib/hangulStrokes";
export {
  HANGUL_STROKE_ORDER as HANGUL_STROKES,
  getHangulStrokes as getStrokeOrder,
} from "../client/src/lib/hangulStrokes";
export type {
  HangulStrokeDiagram,
  HangulStrokeDiagram as CharacterStrokeData,
} from "../client/src/lib/hangulStrokes";

// --- Grammar --------------------------------------------------------------

export {
  GRAMMAR_LESSON_COUNT,
  GRAMMAR_LESSONS,
  GRAMMAR_SENTENCE_LINES,
  findGrammarLesson,
  grammarExampleId,
} from "../client/src/lib/grammar";
export type {
  GrammarExample,
  GrammarLesson,
  GrammarPoint,
  GrammarQuizQuestion,
} from "../client/src/lib/grammar";

export {
  emptyGrammarProgress,
  recordGrammarAttempt,
  sanitizeGrammarProgress,
} from "../client/src/lib/grammarProgress";
export type {
  GrammarProgress,
  GrammarScore,
} from "../client/src/lib/grammarProgress";

// --- Spaced repetition ----------------------------------------------------

export {
  previewIntervals,
  scheduleRecall,
  scheduleReview,
} from "../client/src/lib/srs";
export type {
  IntervalPreview,
  ScheduleReviewOptions,
  SrsCardState,
  SrsRating,
  SrsReviewResult,
  SrsSchedule,
} from "../client/src/lib/srs";

// --- XP and levels --------------------------------------------------------

export {
  LEVEL_TITLES,
  levelFromXp,
  levelProgress,
  levelTitle,
  xpToReachLevel,
} from "../client/src/lib/xp";
export {
  levelFromXp as calculateLevel,
  levelProgress as getLevelProgress,
  levelTitle as getLevelTitle,
} from "../client/src/lib/xp";

/** Total XP required to reach the level after `level`. */
export function getXpForNextLevel(level: number): number {
  return xpToReachLevel(level + 1);
}

// --- Mastery --------------------------------------------------------------

export {
  MASTERY_LABELS,
  MASTERY_STYLES,
  getMasteryState,
} from "../client/src/lib/mastery";
export { getMasteryState as classifyCardMastery } from "../client/src/lib/mastery";
export type {
  CardState,
  MasteryState,
  MasteryState as MasteryTier,
} from "../client/src/lib/mastery";

// --- Queues and forecasts -------------------------------------------------

export {
  DEFAULT_NEW_CARDS_PER_DAY,
  accuracy,
  buildDailyQueue,
  buildReviewForecast,
  countOverdue,
  nextScheduledReview,
  preferNotReviewedToday,
  selectLearningCards,
  selectRecognitionCards,
  selectShadowingCards,
  selectWeakCards,
  summarizeForecast,
} from "../client/src/lib/queue";
export { buildDailyQueue as buildStudyQueue } from "../client/src/lib/queue";
export type {
  CardStates,
  ForecastDay,
  WorkloadStatus,
} from "../client/src/lib/queue";

// --- Local calendar days --------------------------------------------------

export {
  addDays,
  getLocalDateKey,
  msUntilNextLocalMidnight,
} from "../client/src/lib/day";
export { addDays as addDaysToKey } from "../client/src/lib/day";

// --- Study-day history ----------------------------------------------------

export {
  daysStudiedWithin,
  deriveStreak,
  migrateLegacyDay,
  recordStudyDay,
  reviewsWithin,
  sanitizeStudyDays,
} from "../client/src/lib/studyDays";
export {
  daysStudiedWithin as countStudiedDaysInWindow,
  deriveStreak as computeStreak,
} from "../client/src/lib/studyDays";
export type {
  StudyDay,
  StudyDay as StudyDayEntry,
  StudyDayEvent,
  StudyDays,
} from "../client/src/lib/studyDays";

// --- Review log -----------------------------------------------------------

export {
  REVIEW_LOG_LIMIT,
  REVIEW_LOG_SCHEMA_VERSION,
  STUDY_MODES,
  appendReviewEntry,
  createReviewLog,
  sanitizeReviewLog,
} from "../client/src/lib/reviewLog";
export { appendReviewEntry as appendReviewLog } from "../client/src/lib/reviewLog";
export type {
  ReviewLog,
  ReviewLogEntry,
  StudyFlow,
  StudyMode,
} from "../client/src/lib/reviewLog";

// --- Grade intent and outcome --------------------------------------------

export {
  evaluateGrade,
  goalProgress,
  repeatableSession,
} from "../client/src/lib/gradeIntent";
export { evaluateGrade as resolveGradeIntent } from "../client/src/lib/gradeIntent";
export type {
  GradeContext,
  GradeDecision,
  GradeDecision as GradeIntent,
  GoalProgress,
} from "../client/src/lib/gradeIntent";
export type { StudyMode as PracticeGradeMode } from "../client/src/lib/reviewLog";

export { applyGradeOutcome } from "../client/src/lib/gradeOutcome";
export type {
  GradeOptions,
  GradeOutcome,
  GradeResult,
  GradeResult as AppliedGrade,
} from "../client/src/lib/gradeOutcome";

// --- Study session machine ------------------------------------------------

export {
  EMPTY_RESULTS,
  MAX_RESPONSE_TIME_MS,
  MIN_RESPONSE_TIME_MS,
  acknowledgeNewCardIntro,
  clampResponseTime,
  createStudySession,
  shouldShowNewCardIntro,
} from "../client/src/lib/studySession";
export type {
  StudyProductionState,
  StudyRating,
  StudyResults,
  StudySession,
  StudySession as StudySessionMachine,
  StudySessionConfig,
  StudySessionDependencies,
  StudySessionState,
} from "../client/src/lib/studySession";
export type { StudyPhase as SessionPhase } from "../client/src/lib/studyKeys";

// --- Practice question loop ----------------------------------------------

export { createQuestionLoop } from "../client/src/lib/practiceQuestion";
export type {
  PracticeQuestion,
  QuestionLoop,
  QuestionLoopConfig,
  QuestionLoopState,
  QuestionVerdict,
} from "../client/src/lib/practiceQuestion";

export { pickDistractors } from "../client/src/lib/practiceDistractors";
export type { PickDistractorsOptions } from "../client/src/lib/practiceDistractors";

export {
  describeVerdict,
  ratingForVerdict,
} from "../client/src/lib/practiceVerdict";
export type {
  PracticeRating,
  PracticeVerdict,
  PracticeVerdict as VerdictDescription,
} from "../client/src/lib/practiceVerdict";

// --- Dashboard view models -----------------------------------------------

export { buildDashboardView } from "../client/src/lib/dashboardView";
export type {
  DashboardView,
  DashboardViewInput,
  StatsDialogForecast,
  StatsDialogStats,
} from "../client/src/lib/dashboardView";

export {
  RECOGNITION_MIN_CARDS,
  buildModeAvailability,
  buildTodayPlan,
} from "../client/src/lib/dashboardPlan";
export type {
  AvailabilityReason,
  ModeAvailability,
  PracticeModeId,
  TodayPlan,
  TodayPlanInput,
} from "../client/src/lib/dashboardPlan";

export { buildDashboardForecast } from "../client/src/lib/dashboardForecast";
export type {
  DashboardForecast,
  DashboardForecastInput,
  ForecastLabelStyle,
  LabeledForecastDay,
  StatsForecastDay,
} from "../client/src/lib/dashboardForecast";

// --- Dashboard dialog launcher -------------------------------------------

export {
  DIALOG_KINDS,
  NO_DIALOG,
  reduceDialog,
} from "../client/src/lib/dialogLauncher";
export type {
  ActiveDialog,
  DialogAction,
  DialogKind,
  DialogRequest,
  DialogRequestInput,
} from "../client/src/lib/dialogLauncher";

// --- Saved progress -------------------------------------------------------

export {
  SCHEMA_VERSION,
  buildExportPayload,
  getSavedSchemaVersion,
  isNewerSave,
  loadSavedState,
  parseSavedState,
  validateImportPayload,
} from "../client/src/lib/savedState";
export {
  SCHEMA_VERSION as SAVE_VERSION,
  buildExportPayload as serializeExport,
  validateImportPayload as validateImport,
} from "../client/src/lib/savedState";
export type {
  ImportValidation,
  LoadedSave,
  UserSettings,
  UserState,
  UserStats,
} from "../client/src/lib/savedState";

/** A fresh, unsaved progress state with the current save schema. */
export function createDefaultState(): UserState {
  return parseSavedState(null);
}

// --- Storage keys ---------------------------------------------------------

export { PROGRESS_STORAGE_KEY } from "../client/src/lib/progressStorage";

// --- Audio manifest -------------------------------------------------------

export {
  createAudioIndexStore,
  parseAudioManifest,
  planAudioDownload,
  resolveAlphabetClip,
  resolveSentenceClip,
  resolveVocabularyClip,
  sentenceIdsWithClips,
} from "../client/src/lib/audioIndex";
export type {
  AlphabetAudioIndex,
  AudioIndexStore,
  AudioManifest,
  AudioVoice,
} from "../client/src/lib/audioIndex";

// --- Practice scenarios ---------------------------------------------------

export { SCENARIOS };
export type ScenarioItem = (typeof SCENARIOS)[number];

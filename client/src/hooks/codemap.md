# client/src/hooks/

## Responsibility

React adapters over the framework-free domain modules in `../lib`: deck loading,
persisted study state, dashboard view derivation, session/dialog control, and
audio coordination. Hooks own effects, refs, and React state; the policies they
apply are implemented and tested in `../lib`.

## Design

Pattern: **thin adapter + pure core**. Each hook either subscribes to an
external store, memoizes a pure builder, or wraps a pure reducer, keeping
browser/storage/audio side effects at the React edge.

- `useVocabularyDeck()` — seeds with `CURATED_CARDS`/`CURATED_STUDY_READY` so
  the dashboard never blanks, then `loadVocabularyDeck()` dynamic-imports the
  Essential 600 chunk. Returns `VocabularyDeck & { ready }`; errors are logged
  and still mark `ready`.
- `useStudyState()` — the progress adapter. Lazy `readStoredSave()` via
  `loadSavedState`, cross-tab `storage` reconciliation with `isNewerSave` /
  `parseSavedState` (`saveBlocked` when a newer build wrote first), and a
  persist effect keyed on `[state, saveBlocked]` writing `PROGRESS_STORAGE_KEY`
  (`saveError` on failure). `gradeCard` calls `applyGradeOutcome` against a
  `stateRef` (so two grades in one tick compose) and returns the `GradeOutcome`
  synchronously; also exposes `updateSettings`, `recordGrammarResult`
  (`recordGrammarAttempt`), and `replaceState`. Asks
  `requestPersistentStorage()` on first real grade.
- `useHomeDashboard(options)` — one `useMemo` over `buildDashboardView`,
  injecting `SCENARIO_CARD_IDS` from `../components/practice/scenarios` and a
  locale `labelDate` formatter; returns a `DashboardView`.
- `useHomeSessions(...)` — session state machine at the React edge:
  `sessionQueue`, `recognitionSessionCards` (snapshot taken when a recognition
  mode opens so grading cannot reshuffle questions), `sessionMode`
  (`"daily" | "weak" | "learning"`), `isStudying`. Handlers
  `startSession`/`startWeakSession`/`startLearningSession` gate on
  `ModeAvailability`; `closeSession` clears the queue; `handleGrade` forwards
  to `gradeCard` with the active mode and toasts when
  `outcome.goalJustReached`. Listening/scenario/shadowing grades route through
  dedicated handlers that hard-code their practice mode.
- `useDialogLauncher()` — `useReducer(reduceDialog, NO_DIALOG)` adapter for the
  **Dialog launcher**: `{ activeDialog, open, close }`, one active Dialog
  request at a time.
- `useAudioPlayback()` — `useSyncExternalStore(subscribeAudioPlayback,
  getAudioPlayback, getAudioPlayback)` returning `AudioPlaybackState`
  (`{ clip, playing }`), so highlight state cannot drift from the audio element.
- `useAutoPlayOnce({ clipId, enabled, play, onFailure, delayMs = 300 })` —
  plays a clip once per identity after paint; latches `clipId` in a `playedId`
  ref before starting, clears the timer on cleanup.
- `useSentenceAudioIds()` — one-shot `getAvailableSentenceIds()` into a
  `ReadonlySet<string>`; callers hide sentence players with no clip.
- `useLocalDayKey()` — current `getLocalDateKey()` refreshed at
  `msUntilNextLocalMidnight() + 1000` and on `visibilitychange` / `focus`.
- `useComposition()` — IME helper returning
  `{ onCompositionStart, onCompositionEnd, onKeyDown, isComposing }`; suppresses
  Escape/Enter during composition and uses two nested timeouts for Safari's
  compositionEnd-before-keydown ordering.
- `usePersistFn(fn)` — ref-backed stable callback identity (a `useCallback`
  substitute) used by `useComposition`.

## Flow

Inputs: localStorage save, deck chunks, audio manifest ids, OS clock/theme
events. Transform: pure `lib` builders/reducers called from memoized hooks.
Outputs: view models (`DashboardView`, `VocabularyDeck`, `AudioPlaybackState`),
grade callbacks that persist state and return `GradeOutcome`, and dialog
`open`/`close` commands. Effects are cancellable (`active` flags, timer
cleanup, listener removal).

## Integration

- Depends on `@/lib/vocabulary`, `savedState`, `gradeOutcome`, `dashboardView`,
  `dashboardForecast`, `mastery`, `studyDays`, `day`, `audioPlayer`,
  `audioPlaybackState`, `dialogLauncher`, `grammarProgress`,
  `storageProtection`; and on `../components/practice/scenarios`.
- Consumed by `../pages/Home.tsx` (all study/dashboard/session hooks),
  `../pages/AlphabetPractice.tsx` (`useAudioPlayback`), and components under
  `../components` (dialog bodies, audio rows, inputs).

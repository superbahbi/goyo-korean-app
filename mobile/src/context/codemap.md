# mobile/src/context/

## Responsibility
The app's single application-state container and command surface. It owns the
`UserState` (card states, study days, Grades, XP, grammar), the vocabulary deck,
the Dialog request, Study session selection, theme, and transient notices, and
exposes one `GoyoMobileContextValue` to screens.

## Design
- Provider + hook pair: `GoyoMobileProvider` and `useGoyoMobile()` (throws when
  used outside the provider). Screens see data fields plus commands — never raw
  setters.
- State split by lifetime: `useState` for `state`, `today`, `deck`,
  `isStudying`, `sessionQueue`, `sessionMode`, `recognitionSessionCards`,
  `theme`, `notice`; `useReducer(reduceDialog, NO_DIALOG)` for the Dialog
  request (one at a time; open replaces, close returns to none); `useMemo` for
  the derived `DashboardView`.
- Stale-read guard: `stateRef` mirrors `state` and is reassigned inside
  `gradeCard`, `updateSettings`, `recordGrammarResult`, and `replaceState`, so
  several Grades in one tick compose instead of overwriting each other.
- Derived, never stored: `view = buildDashboardView({vocabulary, studyReady,
  cardStates, studyDays, reviewEntries, today, dailyGoal, newCardsPerDay, level,
  totalXp, streak, scenarioCardIds, labelDate})`; `SCENARIO_CARD_IDS` is
  computed once from `SCENARIOS`, and `labelDate` is injected for locale policy.
- Persistence: lazy `readInitialState()` → `loadSavedState(localStorage…)`;
  writing is an effect that serialises `state` under `PROGRESS_STORAGE_KEY`
  unless `saveBlocked` (newer schema) or `localStorage` is absent, so native
  runtimes keep progress in memory only.
- Effects as side channels: deck load (`loadVocabularyDeck`), a 60 s tick plus
  `visibilitychange`/`focus` to roll `today` over, `setAudioSpeaker` whenever
  `settings.audioSpeaker` changes, and a 4 s `notice` auto-dismiss.
- `Theme` is provider-local (`"light" | "dark"`) and is not persisted.

## Flow
- Boot: `readInitialState` → `loadSavedState`/`parseSavedState` seeds `state`
  and `saveBlocked`; `deck` seeds from `CURATED_CARDS` / `CURATED_STUDY_READY`,
  then the async deck replaces it.
- Grade: a screen calls `handleStudyGrade(cardId, rating, {responseTimeMs})`
  (which injects `mode: sessionMode`) or `handleListeningGrade` /
  `handleScenarioGrade` / `handleShadowingGrade` (injecting that Practice mode)
  → `gradeCard` → `applyGradeOutcome(stateRef.current, …)` → new `UserState`
  plus a `GradeOutcome`; `goalJustReached` raises the notice.
- Session start: `startDailySession` / `startWeakSession` /
  `startLearningSession` check `view.modes[...].available`, otherwise set a
  notice; then set queue, mode, and `isStudying`. `closeStudySession` clears
  both and calls `stopAudio()`.
- Dialog: `openDialog` / `openBrowse(category)` / `openListening` /
  `openScenario` / `openShadowing` dispatch to `reduceDialog`; recognition modes
  first cache `view.pools.recognitionCards` and refuse with a notice when
  `reason === "too-few-reviewed-cards"`.
- Maintenance: `updateSettings` shallow-merges a `Partial<UserSettings>`;
  `recordGrammarResult` → `recordGrammarAttempt`; `replaceState` replaces
  wholesale (JSON import); `resetProgress` removes the storage key, re-parses
  `parseSavedState(null, today)`, and clears `saveBlocked`.

## Integration
- Imports only web/domain modules: `client/src/lib/audioPlayer`
  (`setAudioSpeaker`, `stopAudio`), `dashboardView`, `day`, `dialogLauncher`
  (`reduceDialog`, `ActiveDialog`, `DialogRequestInput`, `NO_DIALOG`),
  `gradeOutcome` (`applyGradeOutcome`, `GradeOptions`, `GradeOutcome`),
  `grammarProgress`, `progressStorage`, `savedState`, `vocabulary`, and
  `client/src/components/practice/scenarios`.
- Consumed by `../../App.tsx` and `../components/DashboardScreen.tsx`; other
  screens receive slices as props.
- Sibling maps: `../components/codemap.md`, `../primitives/codemap.md`.

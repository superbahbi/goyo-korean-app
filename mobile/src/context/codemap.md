# mobile/src/context/

## Responsibility

The app's single application-state container and command surface. It exposes
one `GoyoMobileContextValue` to screens: the `UserState` mirror, the
vocabulary deck, the Dialog request, Study session selection, the theme, and
transient notices — plus the commands that mutate them.

## Design

- Provider + hook pair: `GoyoMobileProvider` and `useGoyoMobile()` (throws when
  used outside the provider). Screens see data fields plus commands — never raw
  setters.
- Persistence lives in `shared/storage.ts`'s `createCrossPlatformProgressStore`
  (localStorage, else an in-memory fallback): the store owns hydration, the
  newer-save guard, and save errors; the provider constructs one store, seeds
  React state from `store.getState()`, and re-renders through
  `store.subscribe`. Several Grades in one tick compose because the store
  always grades from its own newest state.
- State split by lifetime: `useState` for `today`, `deck`, `isStudying`,
  `sessionQueue`, `sessionMode`, `recognitionSessionCards`, `themePreference`,
  `notice`; `useReducer(reduceDialog, NO_DIALOG)` for the Dialog request (one
  at a time; open replaces, close returns to none); `useMemo` for the derived
  `DashboardView`.
- Derived, never stored: `view = buildDashboardView({vocabulary, studyReady,
cardStates, studyDays, reviewEntries, today, dailyGoal, newCardsPerDay,
level, totalXp, streak, scenarioCardIds, labelDate})`;
  `SCENARIO_CARD_IDS` is computed once from `SCENARIOS`, and `labelDate` is
  injected for locale policy.
- Theme follows the web app's full `"system" | "light" | "dark"` domain under
  the shared `THEME_STORAGE_KEY`: `themePreference` is what is stored
  (a web-set "system" survives a mobile visit), `theme` is the resolved
  light/dark the screens paint, and a "system" preference tracks
  `prefers-color-scheme` changes while the app is open. `toggleTheme` flips
  the resolved theme by storing an explicit choice; Settings offers all
  three options through `setThemePreference`.
- Effects as side channels: deck load (`loadVocabularyDeck`), a 60 s tick plus
  `visibilitychange`/`focus` to roll `today` over, `setAudioSpeaker` whenever
  `settings.audioSpeaker` changes, and a 4 s `notice` auto-dismiss.

## Flow

- Boot: the store constructor reads `PROGRESS_STORAGE_KEY` synchronously
  (localStorage) and seeds `state`; `deck` seeds from `CURATED_CARDS` /
  `CURATED_STUDY_READY`, then the async deck replaces it; `themePreference`
  seeds from `readStoredTheme()`.
- Grade: a screen calls `handleStudyGrade(cardId, rating, {responseTimeMs})`
  (which injects `mode: sessionMode`) or `handleListeningGrade` /
  `handleScenarioGrade` / `handleShadowingGrade` (injecting that Practice mode)
  → `store.gradeCard` → `applyGradeOutcome` → new `UserState` plus a
  `GradeOutcome`; the subscription mirrors the state and `goalJustReached`
  raises the notice.
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
  wholesale (JSON import); `resetProgress` delegates to `store.resetProgress`
  (removes the storage key, resets to a fresh state, lifts the newer-save
  block).

## Integration

- Imports web/domain modules: `client/src/lib/audioPlayer`
  (`setAudioSpeaker`, `stopAudio`), `dashboardView`, `day`, `dialogLauncher`
  (`reduceDialog`, `ActiveDialog`, `DialogRequestInput`, `NO_DIALOG`),
  `gradeOutcome` (types only), `savedState` (types only), `vocabulary`, and
  `client/src/components/practice/scenarios`; plus the shared adapters
  `shared/theme` (`THEME_STORAGE_KEY`, `ThemePreference`) and
  `shared/storage` (`createCrossPlatformProgressStore`).
- Consumed by `../../App.tsx` and `../components/DashboardScreen.tsx`; other
  screens receive slices as props.
- Sibling maps: `../components/codemap.md`, `../primitives/codemap.md`.

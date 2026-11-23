# mobile/src/components/

## Responsibility

Presentation and interaction layer: dashboard, five Practice modes, browse/
stats/settings dialogs, the flashcard, and the Study session runner. Screens own
only local view state (query, tab, selected choice, JSON draft) and delegate
every Grade, Dialog request, and settings change to the provider in
`../context/GoyoMobileContext.tsx`.

## Design

- Screens are prop-driven; `DashboardScreen` is the only one calling
  `useGoyoMobile()`.
  - `DashboardScreen` — daily-goal hero (`Start Daily Session` / `Repeat
Practice`), Level & Mastery, 7-day Review Plan, practice and category grids.
  - `DialogScreens` — `BrowseScreen` (tag chips + text filter over
    front/back/romanization, 60-row cap, mastery badge), `StatsScreen` (stat
    tiles, mastery split, forecast bars, category accuracy), `SettingsScreen`
    (goal/new-card chips, auto-play, theme, JSON export/import, reset confirm).
  - `FlashCardView` — audio-first front (hear, optional Korean text, then
    reveal) and a back with romanization, meaning, example, usage note.
  - `PracticeScreens` — `AlphabetPracticeScreen` (letter tabs + tips),
    `GrammarPracticeScreen` (lesson list, explanation, inline quiz),
    `ListeningPracticeScreen` / `ScenarioPracticeScreen` (Question loop),
    `ShadowingPracticeScreen` (first 8 cards, self-report).
  - `StudySessionScreen` — React binding for the Session machine.
- Theming is file-local (`LIGHT`/`DARK` constants or a `theme(darkMode)` factory
  returning `{bg, card, line, fg, dim, ok, bad}`); `darkMode: boolean` flows down
  from the shell. Repeated micro-components: `Head`, `Btn`, `Bar`, `Done`,
  `Section`, `Card`, `ProgressBar`, `SpeakButton`.
- Framework-free engines are adapted with `useMemo` + `useSyncExternalStore`:
  `createStudySession(...)` in `StudySessionScreen`, and `useLoop`, a local hook
  wrapping `createQuestionLoop`; `GrammarPracticeScreen` and
  `ShadowingPracticeScreen` use plain `useState` because their flow is local.
  Callbacks live in a `latest` ref so the Session machine is created once per
  queue and is not rebuilt by parent re-renders.
- `Rating` in practice screens is the narrow pair `"again" | "good"`; only the
  study session uses the three-way `StudyRating` (again/good/easy).

## Flow

- Dashboard in: `state`, `view` (from `buildDashboardView`), `theme`, `notice`;
  out: `openDialog`, `openBrowse`, `openListening`, `openScenario`,
  `openShadowing`, `startDailySession`, `startWeakSession`,
  `startLearningSession`, `toggleTheme`, `dismissNotice`.
- Study: queue → `createStudySession({queue, clock, isNewCard, onGrade,
stopAudio, onClose})` → phase `intro` → `dismissIntro` → `recall` →
  `setRevealed(true)` → `grade("again"|"good"|"easy")` → provider applies the
  Grade; failed cards append once; `completed` shows results, `retryCount`, and
  `restart` only when `allowRepeat` (Repeat practice). `cardShown()` fires on
  each index change; `dispose()` runs on unmount; `previewIntervals` supplies
  the day badge on each Rating.
- Practice: cards → `buildListeningQuestions` (first 10 cards, 3 Distractors
  deduped by `back`) or `buildScenarioQuestions` (all scenarios, 2 Distractors,
  prefer `survival` tag) → `loop.answer(id)` → `describeVerdict` →
  `onGrade(card.id, "good"|"again")`. Shadowing marks each card `again`/`good`.
- Audio: playback helpers (`playVocabularyAudio`, `playSentenceAudio`,
  `playAlphabetAudio`) are called directly; `getAvailableSentenceIds()` sets
  `sentenceAudioReady`; `FlashCardView` auto-plays once per unrevealed card.
- Settings: `buildExportPayload` → editable JSON → `validateImportPayload` →
  `onReplaceState`; reset needs a second confirm tap.

## Integration

- Imports `../primitives/dom` for all rendering and
  `../context/GoyoMobileContext` (`useGoyoMobile`) from `DashboardScreen`.
- Imports domain modules directly from the domain package: `packages/domain`
  (`studySession`, `srs.previewIntervals`, `practiceQuestion`,
  `practiceDistractors`, `practiceVerdict`, `shuffle`, `alphabet`,
  `hangulStrokes`, `grammar`, `grammarProgress`, `audioPlayer`, `vocabulary`,
  `mastery`, `savedState`), plus `apps/web/src/components/practice/scenarios` and
  `apps/web/src/components/stats/types`.
- Consumed only by `../../App.tsx` (dashboard, session, or one Modal-hosted
  dialog); `FlashCardView` is also consumed by `StudySessionScreen`.

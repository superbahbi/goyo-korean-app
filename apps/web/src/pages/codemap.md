# apps/web/src/pages/

## Responsibility

Route-level screens and the Hangul practice surface. Pages own screen
composition and transient UI state; they delegate domain logic to `../hooks`
and `@domain` and render presentational pieces from `../components`.

## Design

**`Home.tsx`** (default export `Home`) — the dashboard container, and the only
consumer of nearly every hook:

- Composes `useStudyState`, `useLocalDayKey`, `useVocabularyDeck`,
  `useDialogLauncher`, `useHomeDashboard`, and `useHomeSessions`, then passes
  the resulting `DashboardView` / session callbacks down as props. No derived
  numbers are recomputed in the page.
- Two identity refs: `lastBrowseCategory` (Browse reopens where the learner
  left off) and `cardsStudiedTodayRef` (baseline so loading a save never fires
  the install hint).
- Builds two dependency bundles consumed by the dialog host:
  `HomeDialogDeps` (today, state, settings, grammar, recognition, shadowing,
  browse, stats/forecast) and `StudySessionDeps` (queue, mode, `isStudying`,
  `dailyGoalReached`, `onGrade`, `onClose`).
- Renders `HomeHeader`, `SaveAlerts`, `WelcomeCard`, `ProgressCards`,
  `ReviewPlanCard`, `PracticeMenu`, `QuickLinks`, `CategoryGrid`, and
  `HomeDialogHost`; `view.today.firstRun` suppresses the welcome/plan/category
  sections for a first run.
- Effects: `setAudioSpeaker(state.settings.audioSpeaker)` on settings change;
  one-time iPhone "Add to Home Screen" toast when today's graded-card count
  increases and `shouldSuggestIosInstall()` passes
  (`markIosInstallHintShown` marks it spent).

**`AlphabetPractice.tsx`** (named export `AlphabetPractice({ onClose })`) —
Hangul browser, lazily mounted as a Dialog body:

- Two local states: `selectedCategory: AlphabetCategoryId | null` and
  `currentIndex`. `null` category renders the category chooser (themed cards +
  static `TIPS` guide); a selection renders the card walker.
- Data from `ALPHABET_CATEGORIES` / `getAlphabetCategoryCards(selectedCategory)`
  in `@domain/alphabet`; playback via `playAlphabetAudio(characterId, type)`.
- Uses `useAudioPlayback()` to read `playing` and disable Previous/Next while a
  clip is sounding — no local busy flag.
- Framing via `PracticeShell` + `PracticePrimaryButton` (progress, counter,
  `onBack` returning to categories, footer nav) and `AlphabetCard` for the
  animated glyph plus "Hear Pronunciation".

**`NotFound.tsx`** (default export `NotFound`) — static 404 card that calls
wouter's `useLocation()` setter with `/`.

## Flow

URL/location → `../App.tsx` router → page. Home: persisted `UserState` +
deck + local day → `buildDashboardView` → section props; entry points emit
Dialog requests via `open({ kind, ... })`; grades travel
`handleGrade → gradeCard → applyGradeOutcome` and re-render from new state.
AlphabetPractice: category click → index reset → card walk → Speak/Next/Prev
(blocked while `playing`). NotFound: button → `setLocation("/")`.

## Integration

- Imports `../hooks/*`, `../components/*` (HomeHeader, SaveAlerts, WelcomeCard,
  ProgressCards, ReviewPlanCard, PracticeMenu, QuickLinks, CategoryGrid,
  HomeDialogHost, AlphabetCard, practice/PracticeShell, `ui/*`), `@domain/*`
  (vocabulary, alphabet, audioPlayer, storageProtection), plus `wouter`,
  `framer-motion`, `lucide-react`, `sonner`.
- Consumers: `../App.tsx` routes `/` and the 404 fallback;
  `../components/dialogs/registry.tsx` lazy-loads `AlphabetPractice` for the
  `alphabet` Dialog kind. Cross-links: `../hooks`, `../contexts`, `@domain`.

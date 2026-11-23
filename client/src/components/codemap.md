# client/src/components/

## Responsibility

The presentation layer for the dashboard and every practice surface. These
components render the `UserState`-derived view handed down by `pages/Home.tsx`
and translate learner intent — open a Dialog request, start a Study session,
submit a Grade — into callbacks. They own only transient UI state (reveal,
filters, paging, download progress); persistence, scheduling, and dialog
selection live in `@/lib` and `@/hooks`. Child folders own their own slices:
`browse/`, `dialogs/`, `grammar/`, `practice/`, `settings/`, `stats/`, `study/`,
`ui/`.

## Design

Props-down / callbacks-up throughout; no context store beyond `ThemeContext`.
Feature groups and their named exports:

- **Dashboard shell** — `HomeHeader` (sticky brand, streak, XP, settings entry,
  `ThemeToggle` at `sm+`), `SectionHeading` (eyebrow/title/action, id for
  `aria-labelledby`), `QuickLinks` (Browse Deck, Full Stats launchers),
  `SaveAlerts` (two `role="alert"` storage warnings), `ThemeToggle` (one-tap
  light/dark).
- **Daily plan and progress** — `WelcomeCard` (hero, starts the daily session),
  `ProgressCards` (first-run "Start here" block or Today/Level/Learned tiles),
  `ReviewPlanCard` (7-day forecast, workload Badge), `CategoryGrid` (theme tiles
  deep-link to browse; collapsed to 6, reviewed-first sort), `PracticeMenu`
  (seven tiles; `quiet` collapses for first run).
- **Study session** — `StudySession` (controlled shell over the Session machine
  in `study/useStudySession`; three branches: `NewCardIntro`, recall/reveal, and
  `StudySessionSummary`) and `FlashCard` (a `memo`-wrapped, fully controlled
  reveal surface: audio-first front, romanization toggle, sentence audio,
  usage note, auto-play once per word).
- **Practice modes** — `ListeningPractice` and `ScenarioPractice` drive the
  Question loop from `practice/useQuestionLoop` with `pickDistractors` and map
  verdicts through `ratingForVerdict` (Recognition practice);
  `ShadowingPractice` self-reports "I shadowed it" and is Practice-only;
  `AlphabetCard` + `StrokeOrderDiagram` (animated SVG jamo strokes,
  `useReducedMotion`-aware).
- **Dialog bodies and host** — `BrowseDialog`, `SettingsDialog`, `StatsDialog`
  (re-exports `components/stats/types`), and `HomeDialogHost`, which maps one
  Dialog request through `dialogs/registry` and separately mounts the Study
  session as the documented launcher exception.
- **Resilience and offline** — `ErrorBoundary` (default class export; two-step
  `clearProgress` reset), `LazyBoundary` (class boundary around lazy chunks),
  and `DownloadAllAudio` (Warm every manifest clip in batches of 6 with cancel).

## Flow

`Home` owns all state and passes plain props: `view` (plan, stats, forecast,
pools) → section components → callbacks. Grades arrive as
`onGrade(cardId, Rating, { responseTimeMs })`; `useHomeSessions` records them
through `gradeCard`, and the resulting Grade intent decides schedule, XP, and
daily goal. Entry points call `open({ kind, ... })`, which the Dialog launcher
reducer replaces (never stacks); `HomeDialogHost` then looks up
`DIALOG_REGISTRY[kind]` inside `Suspense` + `LazyBoundary` and calls
`entry.render(request, deps, onClose)`. The Study session is mounted whenever
`study.isStudying && queue.length > 0`, outside that path so a Grade cannot be
replaced by another request. Local UI state resets by remount (dialogs mount
only while open; `FlashCard` keys on `currentCard.id`).

## Integration

Imports domain logic from `@/lib` (`srs.previewIntervals`, `mastery`,
`vocabulary`, `audioPlayer`/`audioIndex`, `dashboardPlan`/`dashboardView`/
`dashboardForecast`, `dialogLauncher`, `gradeIntent.repeatableSession`,
`practiceVerdict`, `queue.selectShadowingCards`), hooks
(`useAudioPlayback`, `useSentenceAudioIds`, `useAutoPlayOnce`), `contexts/
ThemeContext`, and primitives from `./ui`. It consumes `./study`, `./practice`,
`./browse`, `./dialogs`, `./settings`, and `./stats`. The sole page consumer is
`pages/Home.tsx`; `dialogs/registry.tsx` also lazily imports the practice modes
and `pages/AlphabetPractice`.

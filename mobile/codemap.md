# mobile/

## Responsibility

The mobile UI Goyo ships on a phone: a React component tree the Vite SPA
serves at `/mobile`, rendered as plain DOM, plus the iOS harness that wraps it
(`ios/`): a SwiftUI shell whose `WKWebView` loads the prebuilt web export from
`goyo://app` and bridges `HTMLAudioElement` playback to `AVAudioPlayer`. It owns
no domain semantics: Grades, scheduling, XP, and the saved-state format come
from the web/domain modules it imports.

## Design

- **Composition root**: `App.tsx` exports `GoyoMobileApp` (named + default) =
  `GoyoMobileProvider` → `GoyoMobileShell`. No navigation library; the shell is
  a state-driven switch — `isStudying && sessionQueue.length > 0` renders
  `StudySessionScreen`, otherwise `DashboardScreen`.
- **Dialog host**: one `Modal` whose visibility is `activeDialog !== null` and
  whose body is an exclusive `activeDialog.kind` switch (alphabet, grammar,
  listening, scenario, shadowing, browse, stats, settings). A Dialog request
  replaces rather than stacks; `onRequestClose`/`onClose` dispatch close.
- **Config**: `tsconfig.json` extends the root config and includes
  `../shared/**` and `../packages/domain/src/**`. There is no mobile bundler: the
  SPA build at the repo root already compiles everything `mobile/` imports.
- **iOS harness** (`ios/`): `project.yml` (XcodeGen, iOS 17, `net.bahbi.goyo`)
  and `Goyo/GoyoApp.swift`, a SwiftUI shell with a `WKWebView` that serves the
  prebuilt web export from `goyo://app`, plus an injected
  `HTMLAudioElement.play` bridge to `AVAudioPlayer` under an `.playback`,
  `.spokenAudio` `AVAudioSession`.

## Flow

1. `GoyoMobileApp` mounts `GoyoMobileProvider` (`src/context/`) around
   `GoyoMobileShell`.
2. The shell reads `useGoyoMobile()`; dashboard selections call `openDialog`/
   `open*`, session start sets `sessionQueue` + `isStudying`; the modal switch
   mounts exactly one dialog screen.
3. `StudySessionScreen` gets `allowRepeat` from
   `repeatableSession(sessionMode, view.today.dailyGoalReached)` and forwards
   Grades to `handleStudyGrade`; `closeStudySession` returns to the dashboard.
4. Session summary's close and every dialog's close land back in the shell.

## Integration

- Imports `./src/components/*`, `./src/context/GoyoMobileContext`,
  `./src/primitives/dom`, and `packages/domain/src/gradeIntent`
  (`repeatableSession`).
- The root tsconfig include list makes `../shared/**` and
  `../packages/domain/src/**` resolvable from mobile code.
- Consumed by `apps/web/src/App.tsx`, which lazy-loads `../../mobile/App` at the
  `/mobile` route, and by `scripts/install-ios-zen.sh` (`pnpm ios:zen`), which
  builds the SPA and copies `dist/public` into `mobile/ios/Goyo/www` for the
  XcodeGen project.
- Child maps: `src/codemap.md`, `src/components/codemap.md`,
  `src/context/codemap.md`, `src/primitives/codemap.md`.

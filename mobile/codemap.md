# mobile/

## Responsibility
Expo/React Native delivery target for Goyo. It owns platform bootstrapping, the
universal app shell, and native packaging config (Expo manifest, Metro monorepo
resolution, XcodeGen iOS harness). It does not own domain semantics: Grades,
scheduling, XP, and saved-state format come from the web/domain modules it
imports.

## Design
- **Composition root**: `App.tsx` exports `GoyoMobileApp` (named + default) =
  `GoyoMobileProvider` → `GoyoMobileShell`. No navigation library; the shell is
  a state-driven switch — `isStudying && sessionQueue.length > 0` renders
  `StudySessionScreen`, otherwise `DashboardScreen`.
- **Dialog host**: one `Modal` whose visibility is `activeDialog !== null` and
  whose body is an exclusive `activeDialog.kind` switch (alphabet, grammar,
  listening, scenario, shadowing, browse, stats, settings). A Dialog request
  replaces rather than stacks; `onRequestClose`/`onClose` dispatch close.
- **Registration shim**: `index.ts` registers `"main"` through
  `globalThis.require("react-native").AppRegistry` only when a native `require`
  exists, guarded by try/catch; web/Vitest falls through to plain exports.
- **Config**: `app.json` (slug `goyo-korean-app`, `newArchEnabled`, Metro web
  `output: "single"`, assets from `../public/{audio,icons}`); `babel.config.js`
  uses `babel-preset-expo`; `metro.config.js` watches the repo root and maps
  `@` → `client/src`, `@shared` → `shared`; `tsconfig.json` extends the root
  config and includes `../shared/**` and `../client/src/lib/**`.
- **iOS harness** (`ios/`): `project.yml` (XcodeGen, iOS 17, `net.bahbi.goyo`)
  and `Goyo/GoyoApp.swift`, a SwiftUI shell with a `WKWebView` that serves the
  prebuilt web export from `goyo://app`, plus an injected
  `HTMLAudioElement.play` bridge to `AVAudioPlayer` under an `.playback`,
  `.spokenAudio` `AVAudioSession`.

## Flow
1. `index.ts` → `registerNativeRoot()` → `AppRegistry.registerComponent("main",
   () => GoyoMobileApp)`; otherwise exports only.
2. `GoyoMobileApp` mounts `GoyoMobileProvider` (`src/context/`) around
   `GoyoMobileShell`.
3. Shell reads `useGoyoMobile()`; dashboard selections call `openDialog`/
   `open*`, session start sets `sessionQueue` + `isStudying`; the modal switch
   mounts exactly one dialog screen.
4. `StudySessionScreen` gets `allowRepeat` from
   `repeatableSession(sessionMode, view.today.dailyGoalReached)` and forwards
   Grades to `handleStudyGrade`; `closeStudySession` returns to the dashboard.
5. Session summary's close and every dialog's close land back in the shell.

## Integration
- Imports `../shared/core` (`repeatableSession`), `./src/components/*`,
  `./src/context/GoyoMobileContext`, `./src/primitives/react-native`.
- Metro aliases plus the tsconfig include list make `../shared/**` and
  `../client/src/lib/**` resolvable from mobile code.
- Consumed by `client/src/App.tsx`, which lazy-loads `../../mobile/App` at the
  `/mobile` route, and by Expo via root scripts (`pnpm mobile`,
  `mobile:ios`, `mobile:android`, `mobile:web`).
- `package.json` declares `expo-av`, `expo-status-bar`,
  `@react-native-async-storage/async-storage`, and `react-native-web`, but no
  mobile TS module imports them; persistence currently goes through
  `localStorage` when present.
- Child maps: `src/codemap.md`, `src/components/codemap.md`,
  `src/context/codemap.md`, `src/primitives/codemap.md`.

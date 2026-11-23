# mobile/src/

## Responsibility

Source root of the mobile app: it defines the three layers the shell in
`../App.tsx` composes — DOM primitives, the provider that binds Goyo's
domain engine, and the screens — and hosts the parity test. The
root itself contains no production modules.

## Design

- Layering, by dependency direction: `components/` depends on `context/` for
  data/commands and on `primitives/` for rendering; `context/` depends on
  `packages/domain` modules; `primitives/` depends only on `react`.
- Feature folders by role, not route: `components/` (screens), `context/` (one
  provider + hook), `primitives/` (DOM component kit). No barrel files and no
  import aliases inside `src/` — consumers use relative paths
  (`./components/FlashCardView`, `../context/GoyoMobileContext`).
- Naming mirrors the web app's domain vocabulary so the same terms survive the
  platform hop: Study session, Session queue, Practice mode, Dialog request,
  Grade, Rating.
- `App.test.ts` is the only root module: a Vitest suite asserting parity through
  the shared domain modules (curated deck, 18 grammar lessons, Session machine,
  `reduceDialog`, `buildDashboardView`), `shared/storage`
  (`createCrossPlatformProgressStore`, `createMemoryStorage`), `shared/theme`,
  and `flattenStyle`/`Platform` from the primitives.

## Flow

- Boot: `../App.tsx` → `./context/GoyoMobileContext.tsx`
  (`GoyoMobileProvider`) → `./components/DashboardScreen` or
  `./components/StudySessionScreen`, all rendered through
  `./primitives/dom`.
- Read path: the provider derives `DashboardView` and hands it to the dashboard;
  write path: a screen callback invokes a provider command (`handleStudyGrade`,
  `handleListeningGrade`, `updateSettings`, `openDialog`, `resetProgress`, …).
- Dialog path: `activeDialog` (from `reduceDialog`) is consumed by the shell's
  single Modal, which mounts one `./components/DialogScreens` or
  `./components/PracticeScreens` entry.

## Integration

- Upward: consumed by `../App.tsx`, which imports `./components/*`,
  `./context/GoyoMobileContext`, and `./primitives/dom`.
- Downward: `./context` imports `packages/domain/src/*` and
  `apps/web/src/components/practice/scenarios`; `./components` imports
  `packages/domain/src/*`, `apps/web/src/components/practice/scenarios`, and
  `apps/web/src/components/stats/types`; `./primitives` imports only `react`.
- Rendering contract: nothing here imports `react-native` or
  `react-native-web`; the screens render as DOM everywhere the SPA runs —
  browsers, Vitest, and the iOS WKWebView shell.
- Sibling maps: `components/codemap.md`, `context/codemap.md`,
  `primitives/codemap.md`.

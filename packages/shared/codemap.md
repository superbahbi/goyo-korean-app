# packages/shared/

## Responsibility

Framework-free adapters that both delivery surfaces — the web client
(`client/`) and the mobile UI (`mobile/`, rendered as DOM at `/mobile` inside
the iOS WKWebView shell) — consume: saved-progress storage and theme tokens.
`storage.ts` and `theme.ts` carry no React, DOM, or React Native import.

This is a workspace package: it is imported by path alias (`@shared/*`) and by
relative path from `mobile/`, and it will be imported by the Expo app in
`apps/native/`.

## Design

- **Ports and adapters** (`storage.ts`): `SyncOrAsyncStorage`
  (`getItem`/`setItem`/`removeItem`, sync or promise-returning) is the port;
  `createCrossPlatformProgressStore(storage)` is the adapter returning
  `CrossPlatformProgressStore`. `createMemoryStorage` and `getDefaultStorage`
  (localStorage, else one shared memory instance) supply implementations.
- **Token object** (`theme.ts`): `ThemePreference` (`"system" | "light" |
"dark"`), the shared `THEME_STORAGE_KEY`, a `ThemeColors` interface plus
  `LIGHT_THEME` / `DARK_THEME` records; `getThemeColors(mode)` is a pure
  lookup.

## Flow

`storage.ts` reads `PROGRESS_STORAGE_KEY` at construction. Synchronous storage
is parsed immediately via `loadSavedState` (`hydrated = true`); asynchronous
storage keeps an `initialRead` promise and the default `parseSavedState(null)`
until `hydrate()` resolves, reconciling by `revision` so edits made mid-read
are kept and a newer save sets `blocked`. Every mutation (`gradeCard`,
`updateSettings`, `recordGrammarResult`, `replaceState`) does `revision++` →
`persist()` → `notify()`. `persist()` returns early when `blocked`, probes sync
storage with `isNewerSave` (cross-tab guard), writes JSON, and tracks async
writes plus `saveError`. `gradeCard` delegates to `applyGradeOutcome` and
returns its `GradeOutcome`. `flush()` drains `pendingWrites`.

`theme.ts` is pure data: the web client's ThemeContext and the mobile
provider both persist the full preference domain under `THEME_STORAGE_KEY`
and resolve `"system"` against `prefers-color-scheme` themselves.

## Integration

Imports the domain from `client/src/lib/*` — `gradeOutcome`,
`grammarProgress`, `progressStorage`, `savedState`. Consumed by the web
client (`client/src/contexts/ThemeContext` for `THEME_STORAGE_KEY`) and by
mobile (`mobile/src/context/GoyoMobileContext` for the progress store and
theme key, `mobile/src/components/DialogScreens` for `ThemePreference`,
plus `storage.test.ts` and `theme` via `mobile/src/App.test.ts`). The web
client imports its own `lib` modules directly; mobile does the same — nothing
here re-exports or renames the domain.

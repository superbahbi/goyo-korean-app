# shared/

## Responsibility

Framework-free, cross-platform layer that lets the web client (`client/`) and
React Native app (`mobile/`) share one implementation of the domain: vocabulary
and alphabet content, spaced repetition, Grade intent/outcome, study sessions,
saved progress, theme tokens, and audio playback. `core.ts` is the canonical
domain entry point; `storage.ts`, `audio.ts`, and `theme.ts` are platform
adapters that isolate platform globals (`localStorage`, `fetch`) behind injected
ports. `core.ts` and `theme.ts` carry no React, DOM, or React Native import.

## Design

- **Barrel facade with vocabulary aliases** (`core.ts`): re-exports the real
  implementations from `client/src/lib/*` under stable names and adds aliases so
  both call sites read naturally (`levelFromXp`/`calculateLevel`,
  `buildDailyQueue`/`buildStudyQueue`, `evaluateGrade`/`resolveGradeIntent`,
  `StudySession`/`StudySessionMachine`, `StudyDay`/`StudyDayEntry`). Only
  `getXpForNextLevel` and `createDefaultState` are defined locally; `SCENARIOS`
  is imported and re-exported.
- **Ports and adapters** (`storage.ts`): `SyncOrAsyncStorage`
  (`getItem`/`setItem`/`removeItem`, sync or promise-returning) is the port;
  `createCrossPlatformProgressStore(storage)` is the adapter returning
  `CrossPlatformProgressStore`. `createMemoryStorage` and `getDefaultStorage`
  (localStorage, else one shared memory instance) supply implementations.
- **Ports and adapters** (`audio.ts`): `PlatformAudioDriver { playUrl, stop }`
  is the only platform obligation. `createCrossPlatformAudioController({
  baseUrl, fetchManifest, driver })` owns the loaded Audio manifest, selected
  `AudioVoice`, current `PlayingClip`, playback token, and subscriber set.
- **Token object** (`theme.ts`): `ThemeColors` interface plus `LIGHT_THEME` /
  `DARK_THEME` records; `getThemeColors(mode)` is a pure lookup.

## Flow

`core.ts` is import-time re-export only: it composes vocabulary, alphabet,
Hangul strokes, grammar and grammar progress, SM-2 (`srs`), XP/levels, mastery,
queues and forecasts, local day keys, study-day history, review log, Grade
intent and outcome, the study-session machine, the question loop, dashboard
view models/plan/forecast, dialog launcher, saved state, and the Audio manifest
helpers. There is no runtime state.

`storage.ts` reads `PROGRESS_STORAGE_KEY` at construction. Synchronous storage
is parsed immediately via `loadSavedState` (`hydrated = true`); asynchronous
storage keeps an `initialRead` promise and the default `parseSavedState(null)`
until `hydrate()` resolves, reconciling by `revision` so edits made mid-read are
kept and a newer save sets `blocked`. Every mutation (`gradeCard`,
`updateSettings`, `recordGrammarResult`, `replaceState`) does `revision++` →
`persist()` → `notify()`. `persist()` returns early when `blocked`, probes sync
storage with `isNewerSave` (cross-tab guard), writes JSON, and tracks async
writes plus `saveError`. `gradeCard` delegates to `applyGradeOutcome` and
returns its `GradeOutcome`. `flush()` drains `pendingWrites`.

`audio.ts` loads the Audio manifest lazily once (`fetchManifest` or
`index.json`), parses it with `parseAudioManifest`, caches it, and retries after
a failed load. `playVocabulary`/`playAlphabet`/`playSentence` resolve a
content-hashed filename for the active `AudioVoice`, then `playFile` stops the
driver, increments `playbackToken`, notifies, and awaits
`driver.playUrl(resolvedUrl)`. Missing clips, failed loads, and driver
rejections resolve `false` instead of throwing. `setSpeaker` and `stop` notify;
`subscribe` returns its unsubscribe function.

## Integration

Imports the domain from `client/src/lib/*` — vocabulary, alphabet,
hangulStrokes, grammar, grammarProgress, srs, xp, mastery, queue, day,
studyDays, reviewLog, gradeIntent, gradeOutcome, studySession, studyKeys,
practiceQuestion, practiceDistractors, practiceVerdict, dashboardView,
dashboardPlan, dashboardForecast, dialogLauncher, savedState, progressStorage,
audioIndex — plus `client/src/components/practice/scenarios`. Consumed by
`mobile/App.tsx` (`shared/core`) and `mobile/src/App.test.ts`
(`shared/core`, `shared/storage`, `shared/theme`). `shared/audio.ts` is
currently exercised by `shared/audio.test.ts` and not yet wired to a platform
driver. The web client still imports its own `lib` modules directly, so this
folder mirrors their public API rather than replacing it.

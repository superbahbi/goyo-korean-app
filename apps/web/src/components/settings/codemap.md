# apps/web/src/components/settings/

## Responsibility

The sections that fill the Settings dialog: theme, study pace (daily goal, new
cards per day, auto-play), Korean speaker, progress export/import, progress
reset, offline audio download, and app reload. It also owns `useProgressFile`, the hook that
implements the export → validate → confirm → replace flow around
`UserState`.

## Design

Each section is a controlled leaf component that receives
`settings: UserState["settings"]` plus `updateSettings(partial)` and writes
through the dashboard's single state owner; none of them persist or read
localStorage directly. Named exports:

- `ThemeSetting` — `radiogroup` over system/light/dark from `ThemeContext`.
- `DailyGoalSetting`, `NewCardsPerDaySetting`, `AutoPlaySetting` (all from
  `StudyPaceSettings.tsx`) — Radix `Select` / `Switch`; changing to auto-play
  off calls `stopAudio()`.
- `AudioSpeakerSetting` — speaker `Select`; returns `null` when
  `FEMALE_VOICE_ENABLED` is false, and keeps `setAudioSpeaker` in sync.
- `ProgressFileSection` — export/import buttons, an "Include review log"
  checkbox, backup-age copy, and the amber "Replace current progress?" confirm
  region driven by `pendingImport`.
- `ResetProgressSetting` — a "Reset progress" button that opens a red
  "Erase all progress in this browser?" confirm region (Cancel has focus)
  before calling `resetProgress()` from `useStudyState`; theme and downloaded
  audio are kept.
- `ReloadSetting` — injects `navigator.serviceWorker` and timer functions into
  `reloadToLatestApp`, so the reload policy stays framework-free.

`useProgressFile({ state, replaceState, saveBlocked, today })` is a headless
hook returning
`pendingImport`, `clearPendingImport`, `includeReviewLog`/`setIncludeReviewLog`,
`lastBackupAt`, `importInputRef`, `handleExportProgress`, `handleImportFile`,
and `confirmImport`. Its public type is `ProgressFile =
ReturnType<typeof useProgressFile>`, so the section consumes the hook's shape
without duplicating it.

## Flow

Settings writes: `onValueChange` → validated number / enum →
`updateSettings({...})` → `UserState.settings` in `useStudyState` → toast
confirmation. Export: `buildExportPayload(state, new Date(), { includeReviewLog
})` → JSON Blob → `goyo-progress-<today>.json` download → `recordBackup()` and
`setLastBackupAt(now)`. Import: file input → `file.text()` →
`validateImportPayload`; a failure toasts and stops, a success sets
`pendingImport` and renders the confirmation. While `saveBlocked` (a newer
build's save is stored), both the file pick and `confirmImport` toast "Import
paused" instead, because the store would not write the import. `confirmImport` calls
`replaceState`, preserving the current `reviewLog` when the imported file has
none, then toasts a card count. The hook's drafts are fresh because the dialog
mounts only while open; closing calls `clearPendingImport`.

## Integration

Imports `@/components/ui/{select,switch,checkbox,button}`,
`@/contexts/ThemeContext`, and domain modules `@domain/savedState`,
`@domain/backupStatus`, `@domain/appReload`, `@domain/audioPlayer`,
`@domain/voiceAvailability`. Consumed by `../SettingsDialog.tsx`, which instantiates
`useProgressFile` once and passes it to `ProgressFileSection`; that dialog is
reached through the `settings` Dialog request in `../dialogs/registry.tsx`.
`../DownloadAllAudio.tsx` lives one level up but is rendered inside the same
dialog, between this folder's sections.

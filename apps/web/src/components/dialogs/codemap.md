# apps/web/src/components/dialogs/

## Responsibility

The Dialog registry: the single mapping from a Dialog request's kind to the
component that renders it, together with the narrow dependency contract each
dialog may read. It is the dispatch table that `HomeDialogHost` consults, not a
host and not a state store.

## Design

`registry.tsx` exports three things:

- `HomeDialogDeps` — the dependency contract, grouped by concern so no dialog
  sees the whole dashboard: `today`, `state: UserState`, `settings` (
  `updateSettings`, `replaceState`), `grammar` (`progress`, `onComplete`),
  `recognition` (`cards`, `onListeningGrade`, `onScenarioGrade`), `shadowing`
  (`cards`, `onGrade`), `browse` (`vocabulary`), `stats`, and `forecast`.
- `DialogEntry` — `{ render(dialog, deps, onClose): ReactNode }`.
- `DIALOG_REGISTRY: Record<DialogKind, DialogEntry>` — keyed by the
  `DIALOG_KINDS` union from `@domain/dialogLauncher`, so a missing or extra kind is
  a compile error and dispatch is a lookup rather than a `switch` with a silent
  default.

Every target is `lazy()`-imported at module scope: `pages/AlphabetPractice`
(named `AlphabetPractice`), `components/ListeningPractice`,
`ScenarioPractice`, `ShadowingPractice`, `BrowseDialog`, `SettingsDialog`,
`StatsDialog`, and `components/grammar/GrammarDialog`. Entries are thin
adapters: each hardcodes `open` or forwards the request payload, and converts
the child's `onOpenChange(false)` into the host's `onClose` so the launcher, not
the dialog, remains the source of truth. Only the `browse` entry narrows
`dialog.kind === "browse"` to read `dialog.category`; all others ignore the
request and use their grouped deps.

## Flow

In: an `ActiveDialog` (a Dialog request or `null`) arrives at `HomeDialogHost`,
which selects `DIALOG_REGISTRY[dialog.kind]`. `HomeDialogHost` wraps the call in
`Suspense` (spinner fallback) and `LazyBoundary` (chunk-failure recovery), then
invokes `entry.render(dialog, deps, onClose)`. The entry mounts its lazy
component with `open` already true and wires the specific callbacks:
recognition modes read `deps.recognition.cards` and grade with the matching
handler; shadowing reads `deps.shadowing.cards`; browse reads
`deps.browse.vocabulary` and `deps.state.cardStates`; stats/settings read
`deps.stats`/`deps.forecast`/`deps.state` and `deps.today`. Out: a dialog close
or any completion callback flows back to `Home` through the host's `onClose`,
which dispatches the launcher's `close` and leaves nothing mounted. The registry
itself holds no state, so reopening a dialog starts from fresh internal state.

## Integration

Depends on `@domain/dialogLauncher` (`DialogKind`, `DialogRequest`),
`@domain/savedState`, `@domain/grammarProgress`, `@domain/vocabulary`, and
`@/components/stats/types`; lazily imports the dialog and practice components
in `../` and `../grammar/`. Consumed only by `../HomeDialogHost.tsx`, which
supplies `HomeDialogDeps` from `pages/Home.tsx`. `registry.test.ts` asserts the
keys equal `DIALOG_KINDS` and that every entry has a callable `render`.

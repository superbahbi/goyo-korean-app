# 0004. The dashboard opens one dialog at a time through one request

- Status: Accepted
- Date: 2026-11-02

## Context

`Home` held eight booleans and threaded roughly thirty-five props through a pass-through
module that lazily mounted eight dialogs. Opening a mode required three or four props, and
the pass-through failed the deletion test: its interface was as wide as its children's
combined, with no policy of its own.

## Decision

`lib/dialogLauncher.ts` defines one `DialogRequest` discriminated union and a reducer;
`components/dialogs/registry.tsx` maps `DialogKind` to a lazy component through
`Record<DialogKind, DialogEntry>`, so a missing dialog is a compile error. Dispatch is a
registry lookup, not a switch with a silent default. Each dialog reads a grouped deps
contract (`grammar`, `recognition`, `shadowing`, `browse`, `stats`) rather than the whole
dashboard. Opening another dialog replaces the current one.

## Consequences

- One value describes what is open; no flag combinations can disagree.
- Adding a dialog forces an entry in the type and the registry.
- The study session is an explicit exception: it is a session surface, not a dashboard
  dialog, and is mounted beside the host.
- Deps are grouped by concern; a new dialog should add a group rather than widen the whole
  bag.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in this repo. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` at repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### UI work

A request that names a screen, not a file: start at `docs/ui-map.md`. If two or
more screens could match, ask which one before reading further.

After changing a screen, run `pnpm shots` and read the PNGs in
`.tmp/shots/current/` before calling it done.

## Repository Map

A full codemap is available at `codemap.md` in the project root.

Before working on any task, read `codemap.md` to understand:
- Project architecture and entry points
- Directory responsibilities and design patterns
- Data flow and integration points between modules

For deep work on a specific folder, also read that folder's `codemap.md`.

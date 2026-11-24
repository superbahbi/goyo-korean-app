## This repo: goyo-korean-app

Read `codemap.md` at the repo root before delegating: it maps the three deliverables (web
client `apps/web/`, mobile `mobile/`, content pipeline `scripts/`) and the dependency
direction between them. For deep work in a folder, read that folder's `codemap.md` too.
Treat a map as navigation, never as proof — a lane still cites paths and lines.

Domain language is fixed: `GLOSSARY.md` plus `docs/adr/`. A lane that names a domain concept
uses the glossary term; a lane that contradicts an ADR says so explicitly instead of quietly
overriding it.

Screen requests start at `docs/ui-map.md`. If two or more rows could match the screen the
user named, ask which one before any lane reads further.

Delivery is one sequence, not per-task improvisation: `docs/agents/delivery.md`. The gate is
`pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` from the repo root,
and nothing is pushed before it passes. `pnpm shots` after a screen change (the PNGs in
`.tmp/shots/current/` must be read, not just generated) and `pnpm audit:content` after a
content change belong to the change that triggered them. `pnpm test:e2e` is required when the
change touches rendering, audio, the PWA, offline behaviour or `/mobile`.

Issues and specs live as GitHub issues (`gh` CLI). A PR references its tracking issue and
reports real numbers from the gate, not "tests pass".

Every delegation brief names the scope, the files the lane may write, the validation owner,
and the gate command that proves the work. Lanes report command, exit status and skips.

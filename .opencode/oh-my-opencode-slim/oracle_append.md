## This repo: goyo-korean-app

Judge against this repo's own architecture, not a generic ideal: `packages/domain/` is pure
and framework-free, the hooks in `apps/web/src/hooks/` are thin adapters, presentation
renders a precomputed view model and delegates upward, and `packages/shared/` holds the
adapters both surfaces need. A suggestion that moves logic into a component, or lets a
domain module import React, is a regression, not an improvement.

Check `docs/adr/` and `GLOSSARY.md` before recommending a change, and flag a conflict with
an existing ADR explicitly rather than overriding it silently.

Tie every recommendation to proof: name the file and lines, and the gate command
(`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm shots`) that
would show it works. Say when a change to a screen also needs the screenshots in
`.tmp/shots/current/` read, and when a move also needs the alias, importer, script and
codemap checklist in `docs/agents/delivery.md`.

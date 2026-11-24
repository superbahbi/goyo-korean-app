## This repo: goyo-korean-app

Architecture you must not break: `packages/domain/` is pure (no React, no browser), the hooks
in `apps/web/src/hooks/` are thin adapters over it, and presentation never computes domain
state — components render a precomputed view model and delegate Grades and Dialog requests
upward through callbacks. Keep the direction `apps/web / mobile → packages/domain ←
packages/shared`.

Use the vocabulary of `GLOSSARY.md` in names, tests and commit text. If the change
contradicts an ADR in `docs/adr/`, say so in your report instead of silently overriding it.

Stay inside the brief. Do not rename, move or reformat files the brief does not name, and do not
run a repo-wide `prettier --write`: format only the files you changed. Do not `git stash` to look
for a formatting baseline — the committed tree is formatted.

Validation runs from the repo root and is reported with the command and its exit status:
`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, plus `pnpm test:e2e` when the change
touches rendering, audio, the PWA, offline behaviour or `/mobile`. A changed screen also
needs `pnpm shots` and the PNGs in `.tmp/shots/current/` read before the change counts as
done; changed content needs `pnpm audit:content`. Report skips explicitly.

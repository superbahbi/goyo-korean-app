# goyo-korean-app/

## Responsibility

Goyo — an audio-first Korean vocabulary PWA with spaced repetition. One repo
ships four deliverables from a single domain core:

- **Web client** (`apps/web/`): React 19 + Vite + Tailwind 4 SPA, installable
  Workbox PWA, progress in `localStorage` with JSON export/import. Free,
  offline-capable, no accounts.
- **Marketing site** (`apps/marketing/`): static Vite site with shared theme tokens,
  a pronunciation demo, and a separate Vercel project.
- **Mobile app** (`mobile/`): the mobile UI the Vite SPA serves at `/mobile`,
  rendered as plain DOM, wrapped by the iOS WKWebView shell in `mobile/ios/`
  that bridges `HTMLAudioElement` playback to `AVAudioPlayer`.
- **Content pipeline** (`scripts/` + `public/audio/`): ElevenLabs clip
  generation, content-hash audio manifest, deterministic deck audits.

The domain language (Grade, Rating, Grade intent, Practice mode, Dialog
request, Audio manifest) is fixed in `GLOSSARY.md` — read it before editing
anything that touches study progress.

## Design

Monorepo, pnpm workspace. The core architectural rule is a strict
dependency direction:

```
mobile/src/*  ──┐
apps/web/src/hooks, pages, components ──▶ packages/domain (pure domain, no React)
packages/shared/ (progress store + theme tokens) ──┘
```

- `packages/domain/` is framework-free: it turns a Grade into SM-2 scheduling,
  XP, and daily-goal progress, and owns the versioned saved-state format.
  React hooks in `apps/web/src/hooks/` are thin adapters over it.
- Presentation never computes domain state: components render a precomputed
  `DashboardView` and delegate Grades/Dialog requests upward via callbacks;
  the Dialog registry (`apps/web/src/components/dialogs/`) maps one Dialog
  request to one lazily mounted dialog.
- `packages/shared/` holds the two adapters both surfaces need: the
  cross-platform progress store (`storage.ts`) and the theme tokens
  (`theme.ts`). Mobile imports the domain itself from `packages/domain`,
  exactly as the web client does — there is no alias barrel and no second
  naming.

## Flow

A learner action flows: UI event → hook (`gradeCard`) → `packages/domain`
(`evaluateGrade` → `applyGradeOutcome` → SM-2 schedule + XP) → persisted
`UserState` in `localStorage` → recomputed `DashboardView` → re-render.
Audio: domain ID → Audio manifest (`public/audio/index.json`) → cached clip
(Workbox precache for Hangul/numbers, on-demand for the 26 MB vocabulary
library). Content flows one way: `scripts/` generates audio and audits decks
into `public/` and `packages/domain` datasets; the app never writes content.

## Integration

- **Build**: `vite.config.ts` (root) — Tailwind 4, `VitePWA` precache config
  reading the audio manifest, alias `@/*` → `apps/web/src/*`,
  `@domain/*` → `packages/domain/src/*` and `@shared/*` →
  `packages/shared/*` (mirrored in `tsconfig.json`).
- **Deploy**: `vercel.json` — SPA rewrites, immutable asset/audio caching,
  no-cache for `sw.js`/`index.html`/audio manifest, strict CSP.
- **Quality gates**: `vitest.config.ts` (unit), `playwright.config.ts`
  (e2e in `e2e/`, boots the Vite dev server), `eslint.config.js`,
  `pnpm check` (tsc --noEmit).
- **Docs**: `README.md` (setup), `GLOSSARY.md` (domain terms),
  `docs/` (ADRs, issue-tracker and UI-map conventions, see `AGENTS.md`).

## Repository Directory Map

| Directory                           | Responsibility                                                                                    | Link                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/marketing/`                   | Static landing page, pronunciation demo, and separate Vercel configuration                        | [View Map](apps/marketing/codemap.md)                   |
| `apps/web/`                         | Vite web-client root: SPA document, PWA meta, pre-paint theme                                     | [View Map](apps/web/codemap.md)                         |
| `apps/web/src/`                     | Composition root: React mount, provider stack, routes, SW registration, Tailwind token theme      | [View Map](apps/web/src/codemap.md)                     |
| `packages/domain/`                  | Pure domain layer: Grade→SM-2/XP/goal, datasets, Audio manifest, saved-state format               | [View Map](packages/domain/codemap.md)                  |
| `apps/web/src/hooks/`               | React adapters over the domain package: deck, study state, dashboard view, Dialog launcher, audio | [View Map](apps/web/src/hooks/codemap.md)               |
| `apps/web/src/pages/`               | Route-level screens: Home dashboard, Hangul practice, 404                                         | [View Map](apps/web/src/pages/codemap.md)               |
| `apps/web/src/contexts/`            | Theme context: persisted light/dark/system choice                                                 | [View Map](apps/web/src/contexts/codemap.md)            |
| `apps/web/src/components/`          | Presentation layer for dashboard and practice surfaces                                            | [View Map](apps/web/src/components/codemap.md)          |
| `apps/web/src/components/browse/`   | Vocabulary library result list (presentational)                                                   | [View Map](apps/web/src/components/browse/codemap.md)   |
| `apps/web/src/components/dialogs/`  | Dialog registry: Dialog request kind → lazy component + deps contract                             | [View Map](apps/web/src/components/dialogs/codemap.md)  |
| `apps/web/src/components/grammar/`  | Grammar course browser, lesson reader, self-check quiz                                            | [View Map](apps/web/src/components/grammar/codemap.md)  |
| `apps/web/src/components/practice/` | Shared practice-mode shell, choice/feedback/completion, Question loop binding                     | [View Map](apps/web/src/components/practice/codemap.md) |
| `apps/web/src/components/settings/` | Settings dialog sections + `useProgressFile` export/import flow                                   | [View Map](apps/web/src/components/settings/codemap.md) |
| `apps/web/src/components/stats/`    | Stats dialog panels: tiles, forecast, mastery breakdowns                                          | [View Map](apps/web/src/components/stats/codemap.md)    |
| `apps/web/src/components/study/`    | Study-session card UI: intro, production, grade actions, summary                                  | [View Map](apps/web/src/components/study/codemap.md)    |
| `apps/web/src/components/ui/`       | Generated shadcn/Radix primitives, no domain logic                                                | [View Map](apps/web/src/components/ui/codemap.md)       |
| `packages/shared/`                  | Framework-free adapters used by web + mobile: progress store, theme tokens                        | [View Map](packages/shared/codemap.md)                  |
| `mobile/`                           | Mobile UI served by the SPA at `/mobile`; iOS WKWebView shell + audio bridge                      | [View Map](mobile/codemap.md)                           |
| `mobile/src/`                       | Mobile source root: three-layer architecture definition                                           | [View Map](mobile/src/codemap.md)                       |
| `mobile/src/primitives/`            | DOM component kit + RN-flavoured style translator for the mobile screens                          | [View Map](mobile/src/primitives/codemap.md)            |
| `mobile/src/context/`               | Single mobile state container: UserState, deck, Dialog request, commands                          | [View Map](mobile/src/context/codemap.md)               |
| `mobile/src/components/`            | Mobile screens: dashboard, practice modes, dialogs, study runner                                  | [View Map](mobile/src/components/codemap.md)            |
| `scripts/`                          | Content ops: deck audits, ElevenLabs audio pipeline, dev tooling                                  | [View Map](scripts/codemap.md)                          |

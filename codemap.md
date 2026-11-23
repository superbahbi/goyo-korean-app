# goyo-korean-app/

## Responsibility

Goyo — an audio-first Korean vocabulary PWA with spaced repetition. One repo
ships three deliverables from a single domain core:

- **Web client** (`client/`): React 19 + Vite + Tailwind 4 SPA, installable
  Workbox PWA, progress in `localStorage` with JSON export/import. Free,
  offline-capable, no accounts.
- **Mobile app** (`mobile/`): the mobile UI the Vite SPA serves at `/mobile`,
  rendered as plain DOM, wrapped by the iOS WKWebView shell in `mobile/ios/`
  that bridges `HTMLAudioElement` playback to `AVAudioPlayer`.
- **Content pipeline** (`scripts/` + `public/audio/`): ElevenLabs clip
  generation, content-hash audio manifest, deterministic deck audits.

The domain language (Grade, Rating, Grade intent, Practice mode, Dialog
request, Audio manifest) is fixed in `GLOSSARY.md` — read it before editing
anything that touches study progress.

## Design

Monorepo, single pnpm package. The core architectural rule is a strict
dependency direction:

```
mobile/src/*  ──┐
client/src/hooks, pages, components ──▶ client/src/lib (pure domain, no React)
shared/ (re-export layer) ──────────────────┘
```

- `client/src/lib/` is framework-free: it turns a Grade into SM-2 scheduling,
  XP, and daily-goal progress, and owns the versioned saved-state format.
  React hooks in `client/src/hooks/` are thin adapters over it.
- Presentation never computes domain state: components render a precomputed
  `DashboardView` and delegate Grades/Dialog requests upward via callbacks;
  the Dialog registry (`client/src/components/dialogs/`) maps one Dialog
  request to one lazily mounted dialog.
- `shared/` re-exports the canonical domain so `mobile/` consumes exactly the
  web client's implementation.

## Flow

A learner action flows: UI event → hook (`gradeCard`) → `client/src/lib`
(`evaluateGrade` → `applyGradeOutcome` → SM-2 schedule + XP) → persisted
`UserState` in `localStorage` → recomputed `DashboardView` → re-render.
Audio: domain ID → Audio manifest (`public/audio/index.json`) → cached clip
(Workbox precache for Hangul/numbers, on-demand for the 26 MB vocabulary
library). Content flows one way: `scripts/` generates audio and audits decks
into `public/` and `client/src/lib` datasets; the app never writes content.

## Integration

- **Build**: `vite.config.ts` (root) — Tailwind 4, `VitePWA` precache config
  reading the audio manifest, alias `@/*` → `client/src/*` and
  `@shared/*` → `shared/*` (mirrored in `tsconfig.json`).
- **Deploy**: `vercel.json` — SPA rewrites, immutable asset/audio caching,
  no-cache for `sw.js`/`index.html`/audio manifest, strict CSP.
- **Quality gates**: `vitest.config.ts` (unit), `playwright.config.ts`
  (e2e in `e2e/`, boots the Vite dev server), `eslint.config.js`,
  `pnpm check` (tsc --noEmit).
- **Docs**: `README.md` (setup), `GLOSSARY.md` (domain terms),
  `docs/` (ADRs, issue-tracker and UI-map conventions, see `AGENTS.md`).

## Repository Directory Map

| Directory | Responsibility | Link |
|-----------|----------------|------|
| `client/` | Vite web-client root: SPA document, PWA meta, pre-paint theme | [View Map](client/codemap.md) |
| `client/src/` | Composition root: React mount, provider stack, routes, SW registration, Tailwind token theme | [View Map](client/src/codemap.md) |
| `client/src/lib/` | Pure domain layer: Grade→SM-2/XP/goal, datasets, Audio manifest, saved-state format | [View Map](client/src/lib/codemap.md) |
| `client/src/hooks/` | React adapters over `../lib`: deck, study state, dashboard view, Dialog launcher, audio | [View Map](client/src/hooks/codemap.md) |
| `client/src/pages/` | Route-level screens: Home dashboard, Hangul practice, 404 | [View Map](client/src/pages/codemap.md) |
| `client/src/contexts/` | Theme context: persisted light/dark/system choice | [View Map](client/src/contexts/codemap.md) |
| `client/src/components/` | Presentation layer for dashboard and practice surfaces | [View Map](client/src/components/codemap.md) |
| `client/src/components/browse/` | Vocabulary library result list (presentational) | [View Map](client/src/components/browse/codemap.md) |
| `client/src/components/dialogs/` | Dialog registry: Dialog request kind → lazy component + deps contract | [View Map](client/src/components/dialogs/codemap.md) |
| `client/src/components/grammar/` | Grammar course browser, lesson reader, self-check quiz | [View Map](client/src/components/grammar/codemap.md) |
| `client/src/components/practice/` | Shared practice-mode shell, choice/feedback/completion, Question loop binding | [View Map](client/src/components/practice/codemap.md) |
| `client/src/components/settings/` | Settings dialog sections + `useProgressFile` export/import flow | [View Map](client/src/components/settings/codemap.md) |
| `client/src/components/stats/` | Stats dialog panels: tiles, forecast, mastery breakdowns | [View Map](client/src/components/stats/codemap.md) |
| `client/src/components/study/` | Study-session card UI: intro, production, grade actions, summary | [View Map](client/src/components/study/codemap.md) |
| `client/src/components/ui/` | Generated shadcn/Radix primitives, no domain logic | [View Map](client/src/components/ui/codemap.md) |
| `shared/` | Framework-free cross-platform domain re-exports used by web + mobile | [View Map](shared/codemap.md) |
| `mobile/` | Mobile UI served by the SPA at `/mobile`; iOS WKWebView shell + audio bridge | [View Map](mobile/codemap.md) |
| `mobile/src/` | Mobile source root: three-layer architecture definition | [View Map](mobile/src/codemap.md) |
| `mobile/src/primitives/` | RN platform-abstraction facade + RN→CSS style translator | [View Map](mobile/src/primitives/codemap.md) |
| `mobile/src/context/` | Single mobile state container: UserState, deck, Dialog request, commands | [View Map](mobile/src/context/codemap.md) |
| `mobile/src/components/` | Mobile screens: dashboard, practice modes, dialogs, study runner | [View Map](mobile/src/components/codemap.md) |
| `scripts/` | Content ops: deck audits, ElevenLabs audio pipeline, dev tooling | [View Map](scripts/codemap.md) |

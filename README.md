# Goyo

Audio-first Korean vocabulary practice with spaced repetition. Free, offline-capable, no accounts.

React 19 + TypeScript + Vite + Tailwind 4, with a Workbox service worker for the PWA.

- **Deck:** 136 curated cards plus 504 imported Essential 600 cards (640 total), each with a Korean
  example and ElevenLabs pronunciation in two voices.
- **Scheduling:** a small, tested SM-2 variant. The rules live in `docs/improvement-plan.md`.
- **Progress:** `localStorage`, moved between devices with JSON export/import.
- **Analytics:** Vercel Web Analytics — aggregate, cookieless page views; no accounts or personal data.

## Requirements

- Node 22 (`nvm use`) — Vite 7 needs 22.12 or newer.
- pnpm 10 through Corepack: `corepack enable`.

## Getting started

```sh
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

| Command             | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`          | Dev server on port 3000                                                  |
| `pnpm build`        | Production build into `dist/public`                                      |
| `pnpm start`        | Preview the production build (`PORT=4175 pnpm start` to change the port) |
| `pnpm check`        | Type check                                                               |
| `pnpm lint`         | ESLint                                                                   |
| `pnpm test`         | Vitest unit and data tests                                               |
| `pnpm format`       | Prettier write                                                           |
| `pnpm format:check` | Prettier check                                                           |

The gate for every change is `pnpm check && pnpm lint && pnpm format:check && pnpm test && pnpm build`.

## Layout

```
client/src/pages/         Home dashboard shell (the app is a single page)
client/src/components/    Dashboard sections (header, progress, plan, alerts), practice modes,
                          Browse/Stats/Settings dialogs, study session
client/src/components/ui/ shadcn primitives (only the imported ones are kept)
client/src/lib/           Deck data, scheduler, queue, XP, audio player, persistence helpers
client/src/hooks/         Dashboard state, study sessions, deck loading and saved state
public/audio/             Pronunciation library plus index.json and manifests
scripts/                  Audio generation and maintenance scripts
docs/                     Improvement plan
```

## Audio

Clips are pre-generated, not synthesized in the browser. `public/audio/index.json` maps card IDs to
filenames for both voices and is the only file the app reads at runtime.

Regenerating audio needs an ElevenLabs key in `.env.local` (never commit it). See
`scripts/generate-elevenlabs-audio.ts`; `tsx scripts/generate-elevenlabs-audio.ts` uses the full deck.
Do not commit regenerated clips without checking their size and whether the existing ones are fine.

The ~26 MB vocabulary library stays committed to git and is served as static files from
`public/audio/`. That keeps the Vercel deploy and the offline cache simple: every clip is a normal
build artifact with no extra host or credentials. Revisit this if clone/CI checkout or deploy size
becomes a burden, or if regenerated clips start causing merge conflicts on most audio changes.

## Deployment

Vercel builds with `pnpm install --frozen-lockfile` and serves `dist/public`. SPA rewrites and cache
headers live in `vercel.json`.

## Contributing

1. Branch from `main`: `fix/…`, `feat/…`, `chore/…`, `docs/…`.
2. Make one focused change.
3. Run the gate above.
4. Open a PR. CI must be green and a reviewer model checks the diff.

`docs/improvement-plan.md` holds the plan, the current phase and the backlog. Read it before starting
new work; do not keep a second task list elsewhere.

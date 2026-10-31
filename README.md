# Goyo

Audio-first Korean vocabulary practice with spaced repetition. Free, offline-capable, no accounts.

React 19 + TypeScript + Vite + Tailwind 4, with a Workbox service worker for the PWA.

- **Deck:** 136 curated cards plus 517 imported Essential 600 cards, each with a Korean example and
  ElevenLabs pronunciation in two voices.
- **Scheduling:** a small, tested SM-2 variant. The rules live in `docs/improvement-plan.md`.
- **Progress:** `localStorage`, moved between devices with JSON export/import.

## Requirements

- Node 22 (`nvm use`) — Vite 7 needs 22.12 or newer.
- pnpm 10 through Corepack: `corepack enable`.

## Getting started

```sh
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

| Command       | What it does                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `pnpm dev`    | Dev server on port 3000                                                  |
| `pnpm build`  | Production build into `dist/public`                                      |
| `pnpm start`  | Preview the production build (`PORT=4175 pnpm start` to change the port) |
| `pnpm check`  | Type check                                                               |
| `pnpm test`   | Vitest unit and data tests                                               |
| `pnpm format` | Prettier write                                                           |

The gate for every change is `pnpm check && pnpm test && pnpm build`.

## Layout

```
client/src/pages/         Home dashboard (the app is a single page)
client/src/components/    Study session, practice modes, dialogs
client/src/components/ui/ shadcn primitives (only the imported ones are kept)
client/src/lib/           Deck data, scheduler, romanization, audio player
client/src/hooks/         Saved state and deck loading
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

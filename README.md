# Goyo

Audio-first Korean vocabulary practice with spaced repetition. Free, offline-capable, no accounts.

React 19 + TypeScript + Vite + Tailwind 4, with a Workbox service worker for the PWA.

- **Deck:** 136 curated cards plus 504 imported Essential 600 cards (640 total), each with a Korean
  example and ElevenLabs pronunciation in two voices.
- **Practice:** seven modes on one shared shell — daily study, Hangul, grammar, listening, survival
  scenarios, shadowing, and weak-word review — plus twelve TOPIK I grammar lessons with tracked
  progress.
- **Scheduling:** a small, tested SM-2 variant. The rules live in `docs/improvement-plan.md`.
- **Progress:** `localStorage`, moved between devices with JSON export/import.
- **Theme:** system, light and dark, persisted per device.
- **Analytics:** Vercel Web Analytics and Speed Insights — aggregate, cookieless page views and Core Web Vitals; no accounts or personal data.

## Requirements

- Node 22 (`nvm use`) — Vite 7 needs 22.12 or newer.
- pnpm 10 through Corepack: `corepack enable`.

## Getting started

```sh
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

| Command              | What it does                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm audit:content` | Sample imported cards into a Markdown audit sheet                                                                                             |
| `pnpm dev`           | Dev server on port 3000                                                                                                                       |
| `pnpm build`         | Production build into `dist/public`                                                                                                           |
| `pnpm start`         | Preview the production build (`PORT=4175 pnpm start` to change the port)                                                                      |
| `pnpm check`         | Type check                                                                                                                                    |
| `pnpm lint`          | ESLint                                                                                                                                        |
| `pnpm test`          | Vitest unit and data tests                                                                                                                    |
| `pnpm test:e2e`      | Playwright smokes against the production build, Chromium plus the WebKit iPhone project (`pnpm exec playwright install chromium webkit` once) |
| `pnpm format`        | Prettier write                                                                                                                                |
| `pnpm format:check`  | Prettier check                                                                                                                                |

The gate for every change is `pnpm check && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
CI also runs `pnpm test:e2e`, which builds the app and serves it with `vite preview`.

## Layout

```
client/src/pages/         App shell (Home) and the standalone Hangul practice page
client/src/components/    Dashboard sections (header, progress, plan, alerts), the shared practice
                          shell, seven practice modes, grammar course, Browse/Stats/Settings dialogs,
                          study session, theme toggle
client/src/components/ui/ shadcn primitives (only the imported ones are kept)
client/src/lib/           Deck data, scheduler, queue, XP, audio player, persistence helpers
client/src/hooks/         Dashboard state, study sessions, deck loading and saved state
public/audio/             Pronunciation library plus index.json and manifests
scripts/                  Audio generation and maintenance scripts
docs/                     Improvement plan and generated content-audit sheets
```

## Audio

Clips are pre-generated, not synthesized in the browser. `public/audio/index.json` maps card IDs to
filenames for both voices and is the only file the app reads at runtime. Every clip is named
`<base>.<sha256-8>.mp3`, so a regenerated clip gets a new URL and neither the browser cache nor the
service worker's audio cache can keep serving the old bytes.

Regenerating audio needs an ElevenLabs key in `.env.local` (never commit it). See
`scripts/generate-elevenlabs-audio.ts`; `tsx scripts/generate-elevenlabs-audio.ts` uses the full deck.
The generator hashes and renames the new clips and rewrites `index.json` at the end of a run. After
adding or replacing clips by hand, run `pnpm audio:hash` for the same result. `data.test.ts` fails
when a filename's hash does not match its bytes or when `index.json` points at a missing file.

Example-sentence clips use a separate pass and live under the `sentences` key of `index.json`, keyed
by card id. They ship in batches, so the UI only shows "Hear sentence" where a clip exists:

```sh
tsx --env-file=.env.local scripts/generate-elevenlabs-audio.ts --sentences --sample=20
tsx --env-file=.env.local scripts/generate-elevenlabs-audio.ts --sentences            # full deck
tsx --env-file=.env.local scripts/generate-elevenlabs-audio.ts --sentences --grammar   # lesson examples only
tsx --env-file=.env.local scripts/generate-elevenlabs-audio.ts --sentences --voice jini
```

The sample flag writes the same clips and index entries as a full run, so the app can be checked
before spending on the whole library. The female voice writes to `female.sentences`.
Do not commit regenerated clips without checking their size and whether the existing ones are fine.

The ~27 MB audio library stays committed to git and is served as static files from
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

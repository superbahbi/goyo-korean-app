# Goyo

Audio-first Korean vocabulary practice with spaced repetition. Free, offline-capable, no accounts.

React 19 + TypeScript + Vite + Tailwind 4, with a Workbox service worker for the PWA.

- **Deck:** 639 cards: 136 curated plus 504 imported Essential 600 cards, with one duplicate (`essential_171`) dropped. Every card has a Korean
  example and ElevenLabs pronunciation in two voices.
- **Practice:** seven modes on one shared shell — daily study, Hangul, grammar, listening, survival
  scenarios, shadowing, and weak-word review — plus eighteen TOPIK I grammar lessons with tracked
  progress.
- **Scheduling:** a small, tested SM-2 variant. The rules live in `docs/improvement-plan.md`.
- **Progress:** `localStorage`, moved between devices with JSON export/import.
- **Theme:** system, light and dark, persisted per device.
- **Analytics:** Vercel Web Analytics and Speed Insights — aggregate, cookieless page views and Core Web Vitals; no accounts or personal data. The dashboard footer discloses it, and the iOS shell (`goyo://`) never loads it.

## Requirements

- Node 22.12 or newer (`nvm use`), matching `engines` in `package.json` and Vite 7.
- pnpm 10 through Corepack: `corepack enable`.

## Getting started

```sh
pnpm install
pnpm dev          # Web app (Vite) on http://localhost:3000 (mobile view at /mobile)
```

## Scripts

| Command              | What it does                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm audit:content` | Sample imported cards into a Markdown audit sheet                                                                                                                                      |
| `pnpm audio:hash`    | Rename pronunciation clips to `<base>.<sha256-8>.mp3` and rewrite `public/audio/index.json`; run it after adding or replacing clips by hand                                            |
| `pnpm codemap:check` | Fail when a path in `.slim/codemap.json` no longer exists on disk (it does not compare hashes)                                                                                         |
| `pnpm ios:zen`       | Build the web bundle, copy it into the iOS shell, then XcodeGen, `xcodebuild` and `devicectl` install onto a connected iPhone (default device name `Zen`; needs a Mac with Xcode)      |
| `pnpm dev`           | Dev server on port 3000                                                                                                                                                                |
| `pnpm build`         | Production build into `dist/public`                                                                                                                                                    |
| `pnpm start`         | Preview the production build (`PORT=4175 pnpm start` to change the port)                                                                                                               |
| `pnpm check`         | Type check                                                                                                                                                                             |
| `pnpm lint`          | ESLint                                                                                                                                                                                 |
| `pnpm test`          | Vitest unit and data tests                                                                                                                                                             |
| `pnpm test:e2e`      | Playwright smokes against the production build: Chromium (plus a dark-mode rerun of the axe scans) and the WebKit iPhone project (`pnpm exec playwright install chromium webkit` once) |
| `pnpm shots`         | Build and capture the main screens in light and dark at desktop and iPhone sizes (web dashboard plus the `/mobile` route) into `.tmp/shots/current/`                                   |
| `pnpm format`        | Prettier write                                                                                                                                                                         |
| `pnpm format:check`  | Prettier check                                                                                                                                                                         |

The gate for every change is `pnpm check && pnpm lint && pnpm format:check && pnpm test && pnpm build`.
CI also runs `pnpm test:e2e`, which builds the app and serves it with `vite preview`.

## Troubleshooting

- **Stuck on an old version.** Open Settings and use the reload button. It asks a waiting update to
  take over, then reloads, so the new files are the ones served. Progress is kept.
- **A screen says it could not load.** Press "Reload Goyo". This happens when a new version was
  deployed while the app was open; "Try again" cannot fetch a file that no longer exists.
- **A crash screen appears.** Reload first. If it keeps happening, press "Download backup" before
  "Reset local progress" — resetting erases study history on that device. The backup is the stored
  save as written, so it can be imported later from Settings.
- **Moving progress to another device.** Use Settings export, then import on the other device.
  Files over 5 MB are refused.

## Layout

```
apps/web/src/pages/       App shell (Home) and the standalone Hangul practice page
apps/web/src/components/  Dashboard sections (header, progress, plan, alerts), the shared practice
                          shell, seven practice modes, grammar course, Browse/Stats/Settings dialogs,
                          study session, theme toggle
apps/web/src/components/ui/ shadcn primitives (only the imported ones are kept)
apps/web/src/hooks/       Dashboard state, study sessions, deck loading, and the saved-state adapter
packages/domain/         Deck data, scheduler, queue, XP, audio player, saved-state format and persistence helpers
packages/shared/         Cross-platform adapters shared by web and the iOS shell: progress
                          storage (storage.ts) and theme palette (theme.ts)
mobile/                  Mobile UI (rendered as DOM at /mobile) plus the iOS WKWebView
                          shell that serves it; no React Native — audio plays through the
                          Swift AVAudioPlayer bridge
public/audio/            Pronunciation library plus index.json and manifests
scripts/                 Audio generation and maintenance scripts
docs/                    Improvement plan and generated content-audit sheets
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

Vercel builds the repo root with `pnpm install --frozen-lockfile` and serves `dist/public`. SPA
rewrites and cache headers live in `vercel.json`.

The web app lives in `apps/web/`, but the build stays at the repo root: `vercel.json` runs the root
`pnpm build` (which builds `apps/web/` through the root `vite.config.ts`) and publishes
`dist/public`. So the Vercel project needs no dashboard change — the repository's build and output
settings are unchanged.

Every push to `main` deploys the web app automatically. The native app is not on Vercel: the iOS
app is built on this Mac with `pnpm ios:zen` (XcodeGen + `xcodebuild` + `devicectl`) and installed
straight onto the owner's iPhone, not through a web host or EAS.

## Contributing

1. Branch from `main`: `fix/…`, `feat/…`, `chore/…`, `docs/…`, `refactor/…` or
   `test/…`.
2. Make one focused change.
3. Run the gate above.
4. Open a PR. CI must be green and a reviewer model checks the diff.

`docs/improvement-plan.md` holds the plan, the current phase and the backlog. Read it before starting
new work; do not keep a second task list elsewhere.

## License

The source code is released under the [MIT License](LICENSE).

The vocabulary content and the pronunciation audio ship with the app so it works offline:

- The 136 curated cards were written for Goyo. The 504 imported cards take their headwords from
  `The600EssentialKoreanWords.xlsx`; their examples, translations and usage notes were written for
  Goyo and reviewed (see "Reference: deck provenance" in `docs/improvement-plan.md`).
- Word and sentence audio is generated with ElevenLabs.

The MIT License covers the source code. The headword list and the generated audio come from the
sources above and are not covered by it.

`public/robots.txt`, `public/sitemap.xml` and the link-preview tags in `apps/web/index.html` name
the production domain, `https://goyo.bahbi.net`. `public/og-image.png` is rendered by
`pnpm exec tsx scripts/render-og-image.ts`.

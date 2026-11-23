# scripts/

## Responsibility

Repo-local content-operations and development tooling, never shipped in the
app bundle: deterministic audits of the imported Essential deck, ElevenLabs
audio generation with content-hash naming and manifest maintenance, screenshot
capture, and a physical-device iOS install. Scripts read `client/src/lib` and
write only to `docs/audits/`, `public/audio/`, `.tmp/`, or build dirs.

## Design

TypeScript entry points are ESM, resolve the root from `import.meta.url`, and
use an `isDirectRun` guard so helpers stay unit-testable. Clips are named
`<base>.<sha256-8>.mp3`, so a regenerated clip gets a new URL and no cache,
service worker, or immutable header can serve stale bytes.

**Content audit** — `audit-content.ts` (`pnpm audit:content`): `mulberry32`
plus a seeded Fisher–Yates (`seededShuffle`) picks `sampleCards`, re-sorted by
id so a re-run diffs clean. `loadAuditedIds` reads verdicts from
`docs/audits/*.json` for `--unaudited`; `readSheet` re-renders a committed
sheet with `--from`; `renderAuditSheet` emits the Markdown table. `parseArgs`
handles `--limit --seed --out --unaudited --from --help`, and
`resolveSheetPath`/`resolveOutputPath` refuse paths outside `docs/audits/`. It
never writes the deck source; verdicts live in separate JSON.
`enrich-essential-words.py` is the one-off authoring helper (OpenAI
`gpt-5-mini`, strict JSON schema, resumable from `.tmp/essential-enriched.json`).

**Audio pipeline** — `generate-elevenlabs-audio.ts` is the primary generator,
invoked directly: `tsx --env-file=.env.local scripts/generate-elevenlabs-audio.ts
[--voice male|female|jini] [--sentences] [--grammar] [--sample=N] [--force]`.
A `VOICE_PRESETS` table maps each voice to ElevenLabs `voiceId`, model, filename
prefix, manifest, and index slot. Items come from `loadVocabularyDeck`,
`ALPHABET_DATA`, and `GRAMMAR_SENTENCE_LINES`; sentence mode writes
`elevenlabs*_sent_<id>.mp3` and records them in `audio/index.json` via
`recordSentenceIndex`. A worker pool (`ELEVENLABS_CONCURRENCY`, default 3, cap 5) retries four times with exponential backoff on 429/5xx, writes `.part` then
renames, skips a clip when a same-base file already exceeds 1000 bytes, then
runs `hashAudioLibrary` and writes a per-voice manifest summary.
`hash-audio.ts` (`pnpm audio:hash`) exports `audioBaseName`, `contentHash`, and
`hashAudioLibrary`, which dedupes old variants, renames by hash, recursively
rewrites `.mp3` references in `index.json`, and throws on a missing clip.
`generate-essential-audio.py` is the legacy counterpart: regex-parses the deck,
generates both voices with `ThreadPoolExecutor(4)`, and logs failures to
`.tmp/essential-audio-failures.json`. Manifest one-offs:
`complete-alphabet-audio-index.mjs` backfills `cons_001`–`cons_019` and
`vowel_001`–`vowel_021`; `prune-orphan-audio.mjs` drops vanished ids, keeps
mp3s; `update-net-manifest.mjs` repairs the `num_004` entry and
`regenerate-number-four.mjs` regenerates its clip.

**Dev tooling** — `screenshots.ts` (`pnpm shots`) runs Vite `build` + `preview`
unless `SHOTS_BASE_URL` is set, drives Playwright Chromium over desktop
1280×900 and iPhone 15 viewports in light and dark, clears localStorage and
seeds `goyo-theme`, opens each `SCREENS` entry, waits 350 ms for Radix/Framer
Motion, and writes PNGs to `.tmp/shots/<SHOTS_LABEL>/`. `install-ios-zen.sh`
(`pnpm ios:zen`) builds, copies `dist/public` into `mobile/ios/Goyo/www`,
renders the AppIcon with `sips`, then runs `xcodegen`, `xcodebuild`, and
`xcrun devicectl` install/launch.

## Flow

Inputs: deck sources under `client/src/lib`, existing `public/audio/index.json`
and mp3s, `docs/audits/` verdicts, env (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`).
Audit → seeded sample → id sort → Markdown sheet; generate →
TTS POST → mp3 → atomic rename → `hashAudioLibrary` → index/manifest rewrite →
summary; shots → build/serve → navigate → screenshot; iOS → build → copy →
xcodegen → xcodebuild → devicectl. Outputs: `docs/audits/*.md`,
`public/audio/*.mp3` with `index.json` and ElevenLabs manifests,
`.tmp/shots/<label>/*.png`, `.tmp/essential-enriched.json`, and `Goyo.app`.

## Integration

Depends on `client/src/lib/vocabulary`, `essentialVocabulary`, `alphabet`, and
`grammar` as the content source of truth (imported by TS, regex-parsed by
Python); `generate-elevenlabs-audio.ts` imports `hash-audio.ts`. The Audio
manifest written here is parsed at runtime by `client/src/lib/audioIndex`
and is the same map the PWA uses for playback and offline
download, so a clip absent from `index.json` is unreachable. External deps:
ElevenLabs TTS, OpenAI, Playwright, Vite, Xcode. `package.json` exposes
`audit:content`, `audio:hash`, `shots`, `ios:zen`; other scripts run with
`tsx`/`python3` directly.

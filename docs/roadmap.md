# Goyo roadmap

Decisions from the planning interview. A new session or contributor can start from this file without any chat history.

## Product

- Free public web app. The maintainer is the first user.
- Learner: English-speaking beginner. TOPIK I is the ceiling for now. No grammar lessons or intermediate content yet.
- Success: users still reviewing 4+ days a week after 30 days.
- No real users have progress at risk, so the saved format can still change. Add a `schemaVersion`. The v1 to v2 migration is dropped.
- Budget: little or no new audio spend, a few hours a week. The one exception is regenerating the two 무릎 clips.

## Decisions

| Area | Decision |
|---|---|
| Multi-device progress | JSON export/import. No accounts or backend. |
| Measuring retention | No third-party analytics. Use local stats and check-ins with testers. |
| Retention feature | Installable offline PWA first. No push notifications. |
| PWA audio | Precache the app shell and Hangul audio. Cache vocabulary audio on first play. Add an opt-in "Download all" button in Settings. |
| PWA updates | A new version installs in the background and applies on the next launch. No forced reload. |
| Duplicate headwords | Merge true duplicates. Keep genuine homonyms (차, 눈) as separate cards. |
| Romanization | Revised Romanization everywhere. Regenerate the 517 imported entries and add a lint test. |
| Interval growth | Temporary 90-day cap. Leave the growth model alone. Revisit after 30 days of real data. |
| Accessibility | Full WCAG 2.1 AA pass on the main flows. Use Radix `Dialog` for the overlays. |
| Testing | Vitest unit and data tests. CI runs type check, tests and build. Playwright later if needed. |
| CI | GitHub Actions. |
| Package manager | pnpm only, on Node 22 with Corepack, pinned through `packageManager`. Vercel runs `pnpm install --frozen-lockfile`. |
| Dead code | Delete `server/index.ts`, `template.json`, `client/src/const.ts`, `shared/const.ts` and the tracked `.tmp/` files. |
| Git workflow | Commit to `main` until CI exists. After that, short-lived branches and pull requests. |

## Order of work

Each stage is done only when its gate passes.

1. **Tooling.** This is the trial run for the cheaper coder.
   - Switch to pnpm: add `packageManager`, add `.nvmrc` set to `22`, delete `package-lock.json`, `.npmrc` and `patches/`, keep `pnpm-workspace.yaml`, regenerate `pnpm-lock.yaml`, delete and reinstall `node_modules`, and remove the `pnpm` devDependency.
   - Delete the dead files listed above.
   - Add the Vercel SPA rewrite and set the install command to `pnpm install --frozen-lockfile`.
   - Add Vitest, a `test` script, and move `scripts/test-srs.ts` into it.
   - Add a GitHub Actions workflow for type check, tests and build.
2. **Data and scheduling.**
   - `schemaVersion` in saved state.
   - 90-day interval cap.
   - Fix 무릅 to 무릎 and regenerate the two clips (one per voice).
   - Merge duplicate headwords.
   - Revised Romanization for the imported deck, plus a lint test (no `iii`, no final `l`, consistent final consonants).
   - Data tests: no duplicate IDs, every card has audio in both voices, shared headwords agree across decks.
3. **Accessibility.**
   - Move the five practice overlays onto Radix `Dialog` (focus trap, Escape, `aria-modal`).
   - Label icon-only buttons.
   - Make the flashcard reveal keyboard-operable.
   - Remove `maximum-scale=1` from `client/index.html`.
   - Add `aria-pressed` to the filter chips.
   - Announce answer feedback with `aria-live`.
4. **Export/import** of progress as JSON.
5. **PWA**, including lazy-loading the Essential 600 data to shrink the first load.

## Status

| Stage | State | Commit | Notes |
|---|---|---|---|
| 1 Tooling | Done | `71df8d7` | CI confirmed green on GitHub |
| 2 Data and scheduling | Done | `b915f6c`, `e4cce03` | Reviewed in-repo (free reviewer quota ran out); 16 curated romanizations remain in the backlog |
| 3 Accessibility | Done | `e0b8801` | Not independently reviewed; in-app browser re-check still outstanding |
| 4 Export/import | In progress | — | |
| 5 PWA | Not started | — | |

## Who does what

- **Coder:** Claude Haiku 5.5. If it fails a stage's gate twice, escalate to Gemini 3.8 Flash. Use Sonnet or Opus only with the maintainer's approval for a specific task.
- **Reviewer:** DeepSeek V4.1 Flash reviews each pull request's diff. The reviewer is never the same model as the author.
- **Main agent:** switch to Haiku 5.5, with Gemini 3.8 Flash as the fallback. Start a fresh session for each stage to keep the context small.
- **Gate for every stage:** the coder must show passing `pnpm check`, `pnpm test` and `pnpm build` output. Behaviour that tests cannot cover (UI, audio, PWA) is checked in a browser before the stage is called done.

## Deferred, not decided

Accounts and sync, push reminders, sentence-level audio, grammar content, Playwright.

## Backlog

Items from the DeepSeek review that are not in the stages above. Pick them up while touching the relevant files.

- `audioPlayer.ts`: `stopAudio` leaves the previous play promise unsettled, so callers awaiting it can hang.
- `audioPlayer.ts`: `fallbackText`, `ttsEnabled` and `autoPlayAudio` are accepted but never used. Implement them or remove them.
- `audioPlayer.ts`: the female alphabet index uses ID keys and the male index uses mnemonic keys. Use one scheme.
- `audioPlayer.ts`: `vocabularyAudioAliases` is dead code.
- `Home.tsx`: dashboard aggregates and the 30-day forecast are recomputed on every render. Use `useMemo`, and compute the forecast only when the Stats dialog is open.
- `Home.tsx`: the session queue is derived state copied into `useState` by an effect.
- `Home.tsx`: the lazy-load `Suspense` fallback is not an overlay, and there is no per-modal error boundary for failed chunk loads.
- `Home.tsx`: the Browse romanization toggle duplicates text that is already shown.
- `Home.tsx`: closing Browse during playback does not stop the audio.
- `useStudyState.ts`: `gradeCard` and `updateSettings` should use functional state updates, and a `storage` listener would keep two open tabs in sync.
- `useStudyState.ts`: `totalCardsLearned` counts a new card graded "again".
- `StudySession.tsx`: no guard against a double click on a rating button, and the completion screen does not stop audio.
- `FlashCard.tsx`: auto-play re-fires when flipping back to the front.
- `srs.ts`: `box` is written but never read.
- Scripts: remove hardcoded `/home/ubuntu` paths, write the audio manifest atomically, make `generate-elevenlabs-audio.mjs` import the real vocabulary data instead of scraping it with a regex, and delete `reset-alphabet-file.py`, which would overwrite `alphabet.ts` with stale data.
- `vite.config.ts`: remove the `@assets` alias and the `*.manus*` entries in `allowedHosts`.
- `public/audio/index.json`: 29 orphaned IDs belong to cards that were deduplicated out of the deck.
- `client/src/lib/vocabulary.ts` and `docs/phase-1-content-audit.md` still say imported cards are not audio-ready.
- Curated romanization errors: `surv_008`, `surv_009`, `color_001`.
- Remaining curated romanizations that disagree with the transliterator (16): `surv_006` moreugessumnida → moreugetseumnida, `daily_011` isseowo → isseoyo, `num_018` jeomshim → jeomsim, `fam_007`/`fam_008` -seang → -saeng, `emot_006` jarangseueowoyo → jarangseureowoyo, `emot_003` duryeowwoyo → duryeowoyo, `verb_009` nolayo → norayo, the `-heyo` endings on `daily_006/007/008` and `emot_002`, `emot_008`/`emot_009` -daeyo → -deyo, and `verb_013` 듣어요, whose headword is likely 들어요.
- `essentialVocabulary.ts`: `essential_337` uses `가벼운` instead of `가볍다` and is labelled a noun.

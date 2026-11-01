# Goyo improvement plan

This is the single source of truth for what to build next. It replaces the old
`roadmap.md`, `phase-1-content-audit.md` and `srs-recall-quality.md`; their still-relevant
content is folded in below (the SRS model and the deck provenance are reference sections).

Every stage is done only when its gate passes.

## Product

- Free public web app. The maintainer is the first user, so the app is tuned on one real learner first.
- Learner: English-speaking beginner. TOPIK I is the ceiling. No grammar lessons yet.
- Success: users still reviewing 4+ days a week after 30 days.
- Budget: a few hours a week and little or no new audio spend.
- No accounts or backend. Progress lives in `localStorage` and moves by JSON export/import.
- Vercel Web Analytics and Speed Insights for aggregate, cookieless page views and Core Web
  Vitals (enabled 2026-10-31). Retention is still measured locally and by checking in with testers;
  no accounts and no personal data.

## Current state

Verified on 2026-10-31 on `main` after the Phase 4 closeout (`#39`–`#43`):

| Check              | Result                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tsc --noEmit`     | Passes                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `eslint .`         | Passes                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `prettier --check` | Passes                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `vitest run`       | 181 tests pass in 19 files (scheduler, queue, saved state, review log, study days, deck data, XP, audio, audit sampler, audit verdicts, imported part of speech, usage notes, curated examples, phase 3 follow-up)                                                                                                                                                                                                       |
| `playwright test`  | 22 checks pass against the production build: the five flow smokes (study loop, failed-card retry, Browse search and audio, progress export/import, offline reload), five axe scans (dashboard, study, dialogs, Hangul, recognition overlays), seven keyboard/screen-reader semantics checks, and five iPhone WebKit checks (first-tap audio, iOS meta tags and manifest, one-time install hint, offline, service worker) |
| `vite build`       | Passes. Main chunk 108.6 kB (31.7 kB gzipped), with React, vendor, motion and Radix in separate vendor chunks; Essential 600 lazy-loaded as its own 209 kB chunk                                                                                                                                                                                                                                                         |
| CI                 | Type check, lint, format check, tests, build and the Playwright job (Chromium and WebKit) are green on `main`                                                                                                                                                                                                                                                                                                            |

All gates pass.

Phase 4 closeout (2026-10-31): the last oversized UI files were split into focused modules without
changing behavior — `SettingsDialog` 415 → 76 lines, `StudySession` 451 → 221, `StatsDialog`
356 → 86, `BrowseDialog` 350 → 194, `ListeningPractice` 326 → 222 and `ScenarioPractice` 355 → 226.
The Playwright suite gained an iPhone 15 WebKit project and a keyboard/screen-reader semantics spec,
so first-tap audio, the iOS install hint, WebKit offline precache, the study keyboard flow, accessible
names, live-region announcements and Tab/arrow reach are repeatable checks rather than manual ones.

2026-10-31 review fixes: the daily queue now reviews only due cards, so early non-due reviews no
longer move the schedule; `newCardsPerDay` is enforced per calendar day and repeat queues add no
unseen cards; `totalCardsLearned` counts the first successful recall, including cards that were
failed first; audio keeps its cache through blocked autoplay and intentional stops, and stops are not
recorded as failures; newer saves are never overwritten, save failures surface, reset asks for
confirmation, level derives from XP and `dailyGoal` is bounded. The Stats view also gained a 7-day
review count, and the next-review forecast now ignores states for cards no longer in the deck.

What is solid: the deck is validated by tests; the scheduler, queue, saved state, review log,
study-day history, XP and audio player are tested; saves are sanitized and newer saves are never
overwritten; the learning loop retries failed cards and recognition modes cap interval growth; the
daily queue is due-only; audio survives blocked autoplay and intentional stops without evicting the
cache; `lang="ko"`, the contrast fixes, chart labels, reduced motion, dialog descriptions, the iOS
standalone meta tags and the Vercel security/cache headers are in place; CI runs every push; the PWA
precaches the shell, the audio index, Hangul and number audio; and the imported deck's part of speech
and usage notes plus the curated examples are now guarded by tests. Every page and component is now
under 300 lines, and the Playwright suite covers an iPhone-class WebKit engine plus the keyboard and
screen-reader semantics that axe cannot check.

What is open: a human VoiceOver/NVDA pass plus the real-iPhone checks still need hardware, and the
Korean wording still has room for a later naturalness polish (see Phase 3 — content trust). The
automated checks now cover the iPhone engine, first-tap audio, install hint, offline and service
worker registration; they cannot prove hardware audio, an actual install, or an update notice from a
second build. The repo is 48 MB with 26 MB of audio in git. The 300-line target holds for UI code, but
the data and shared modules are still larger: `essentialVocabulary.ts` (7.6k lines) and
`vocabulary.ts` (1.6k) are deck data, and `useStudyState.ts` (559), `alphabet.ts` (491),
`audioPlayer.ts` (384) and `romanize.ts` (314) remain over 300.

## How we work

- **Branch and PR for everything.** No direct commits to `main`.
  `feat/…`, `fix/…`, `chore/…`, `docs/…`. One concern per PR.
- **PR size:** aim for under ~400 changed lines. If a task is bigger, split it.
- **Gate for every PR:** `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test` and
  `pnpm build` all pass, run locally and in CI. CI also runs `pnpm test:e2e` (Playwright) against
  the production build.
  Behaviour tests cannot cover (UI, audio, PWA, iOS) is checked in a browser before merge.
- **Authors and reviewers:** the coder is a cheap model (Haiku 5.5; escalate to Gemini 3.8 Flash if a
  task fails its gate twice). The reviewer is a different model (DeepSeek V4.1 Flash). Never the same
  model as the author. Stronger models only for a specific task the maintainer approves.
- **Briefs to the coder** should name one stage task, the files involved, and the acceptance criteria
  below. Start a fresh session per task to keep context small.
- **Content PRs** list the card ids they touch and the audit verdicts they resolve, so a batch can be
  re-checked without reading the whole diff. Content never ships with new audio unless the headword
  itself changes.
- **Docs stay current.** When a phase closes, update the status table in this file in the same PR.

## Status

| Phase                           | State                                                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Repairs                       | Done (#2–#7); browser and iPhone checks outstanding                                                                                                                                 |
| 1 Learning loop and measurement | Done (#9–#15); device checks outstanding; item 5 partly open                                                                                                                        |
| 2 Structure                     | Done; main chunk 108.6 kB raw / 31.7 kB gzipped with vendor chunks; every page and component under 300 lines                                                                        |
| 3 Content                       | Done; five tasks, a post-close review and a Korean-speaker spot check complete; naturalness polish deferred                                                                         |
| 4 Delivery and accessibility    | Done; headers, iOS meta, `lang`, contrast, focus rings, 22 Playwright checks (Chromium plus WebKit iPhone) and hashed audio; human screen-reader and real-iPhone checks outstanding |
| 5 Tune from data                | Blocked on 30 days of use                                                                                                                                                           |

Phase 0 is merged: offline audio (#2), local environment (#3), visible audio failure (#4), real
settings (#5), protected progress (#6) and the update notice (#7). Its device checks — blocked
audio, auto-play off, `storage.persisted()` on first grade, iPhone install hint, update toast —
still need a browser and an iPhone.

Phase 1 is merged: review log (#9), study-day history (#10), same-session retry (#11), recognition
caps (#12), keyboard shortcuts (#13), queue module (#14) and new-card pace (#15). Task 5's theme
order ships, but frequency ranking for the imported deck waits on the Phase 3 themes and a
frequency signal; the imported cards therefore stay last and in deck order. Browser checks still
outstanding: keyboard flow with a screen reader, recognition modes, and the study-day stats.

---

## Phase 0: Repairs (do first)

Small, high-value fixes. Each bullet is its own PR.

1. **Offline audio.** `client/src/lib/audioPlayer.ts` fetches `/audio/index.json?v=<Date.now()>`
   with `cache: "no-store"`, and `index.json` is not precached (it is absent from `dist/public/sw.js`).
   Offline, the index cannot load, so no clip plays, including precached Hangul clips.
   - Precache `/audio/index.json` in `vite.config.ts` (the audio files themselves stay on demand).
   - Drop the timestamp and `no-store`; let the service worker and HTTP cache do their job.
   - Apply the same to `DownloadAllAudio.tsx`.
   - Acceptance: with the network off, a fresh reload plays Hangul audio and any previously played word.
2. **Visible audio failure.** The study card is audio-only until reveal. If playback fails the card is
   unusable. Add a fallback: a short message plus a "Show Korean" button, and a toast on console error
   paths. Acceptance: muting the device or blocking `/audio/` still lets a session continue.
3. **Dead settings.** `autoPlayAudio` is never read (`autoSpeak` is hard-coded to `true` in
   `StudySession`), and `ttsEnabled` is displayed in Settings but does nothing.
   - Wire `autoPlayAudio` to `FlashCard`'s auto-play.
   - Delete `ttsEnabled` from the type, defaults and parser (persisted saves keep working because
     unknown keys are ignored) and remove its Settings row.
   - Acceptance: with auto-play off, no audio starts without a tap.
4. **Protect progress.** Installable PWAs get persistent storage; browser tabs do not.
   - Call `navigator.storage.persist()` once after the first graded card, and show a one-time prompt
     suggesting install-to-home-screen for iPhone users.
   - Add a gentle "last backed up N days ago" line in Settings with a shortcut to export.
   - Acceptance: Settings shows the backup age; `navigator.storage.persisted()` is requested on first use.
5. **PWA update notice.** `registerType: "prompt"` with no UI means an installed iOS app can stay on an
   old version indefinitely. Use `registerSW`'s `onNeedRefresh` to show a toast with a "Reload" action.
   - Acceptance: a new build shows the notice on the next launch and reloads when tapped.
6. **Local environment.** `pnpm-workspace.yaml` has no `packages:` field, so pnpm 9 errors with
   "packages field missing or empty"; local Node is 20.17 while `.nvmrc` says 22.
   - Move `onlyBuiltDependencies` into `package.json` (`pnpm` field) or add `packages: ["."]`.
   - Raise `engines.node` to `>=22.12` to match Vite 7 and `.nvmrc`.
   - Document Node 22 + `corepack enable` in the README.
   - Acceptance: a clean clone runs `pnpm check`, `pnpm test` and `pnpm build` on Node 22.

## Phase 1: Learning loop and measurement

The reason retention is the metric: right now the app cannot measure whether anyone is retaining.

1. **Review log.** Append `{ cardId, at, rating, responseTimeMs, mode }` to a capped local array
   (5,000 entries, oldest dropped) with `schemaVersion`. Keep it out of the export by default, with a
   "include review log" checkbox.
   - Acceptance: after a session, the log contains one entry per grade; export/import still round-trips.
2. **Study-day history.** Store one entry per studied day with card and review counts. Derive the streak
   and a new Stats block from it instead of the `cardsStudiedToday` counter.
   - Acceptance: Stats shows days studied in the last 7 and 30 days. Streaks survive a reinstall via import.
3. **Same-session retry.** A card graded `Again` re-enters the session queue once, near the end, before
   the summary. The SRS still records failure immediately.
   - Acceptance: failed cards appear again in the same session; re-grading does not double count XP or
     the review count (the existing same-day guard already covers the schedule).
4. **Recognition modes stop inflating intervals.** Listening, Scenario and Shadowing score recognition,
   not recall, but grade cards identically.
   - Listening and Scenario: cap the interval growth (for example `good` behaves like the 2-day
     reinforcer) and never introduce brand-new cards.
   - Shadowing: self-reported, so treat it as practice only.
   - Listening also draws questions from due and weak cards first, not the whole deck, and keeps
     distractors distinct in meaning.
   - Acceptance: a card first met in Listening has a `timesReviewed` of 1 and a 1–2 day interval, not a
     multi-week one. New tests cover the cap.
5. **New-card pacing.** Replace the hard-coded `slice(0, 3)` with a `newCardsPerDay` setting (default 3).
   Order new cards by theme and frequency, not source row order, so a beginner meets the most useful
   words first.
   - Pacing is merged (#15): `newCardsPerDay` defaults to 3 and clamps to 1–10.
   - New cards follow the curated theme order (survival, daily, numbers, food, …) before imported
     cards. The imported deck still has no theme or frequency metadata, so frequency ranking waits
     on Phase 3; its cards stay last and in deck order until then.
6. **Queue as a tested module.** Move the queue, forecast and workload logic out of `Home.tsx` into
   `client/src/lib/queue.ts` with unit tests (due order, weak selection, new-card cap, no duplicates).
7. **Keyboard shortcuts** in the study session: `Space` reveals, `1`/`2`/`3` grade, `Esc` closes.
   - Acceptance: all three work with a screen reader announcing the new card.

## Phase 2: Structure and tooling

Done. Final sizes: main chunk 108.6 kB raw / 31.7 kB gzipped, with React, vendor, motion and Radix in
separate vendor chunks and the dialogs plus practice views lazily loaded. Every file is covered by
type checking, ESLint and Prettier; tests are type-checked too.

1. Split `client/src/pages/Home.tsx` into `pages/Home.tsx` (layout and state), `components/BrowseDialog.tsx`,
   `components/StatsDialog.tsx`, `components/SettingsDialog.tsx`, dashboard sections under
   `components/`, and `lib/queue.ts` (Phase 1) and `lib/xp.ts` (level math shared with `useStudyState`).
   Target: no file over 300 lines.
   - Done: `Home.tsx` is 274 lines and the dashboard now uses `useHomeDashboard`, `useHomeSessions` and
     section components. The 300-line target is met for every page and component after the Phase 4
     closeout split: `SettingsDialog` 76, `StudySession` 221, `StatsDialog` 86, `BrowseDialog` 194,
     `ListeningPractice` 222 and `ScenarioPractice` 226, with the extracted pieces in
     `components/settings/`, `components/study/`, `components/stats/`, `components/browse/` and
     `components/practice/`. Deck data and shared modules remain larger; see "What is open".
2. Delete the unused `client/src/components/ui/*` files and the dependencies only they use
   (recharts, react-hook-form, @hookform/resolvers, zod, embla-carousel-react, cmdk, input-otp,
   react-day-picker, react-resizable-panels, vaul, nanoid, and `workbox-window` if unused).
   Re-check the bundle after each batch. Target: under 400 kB raw main chunk.
   - Done: 41 files were unused by then (not 37), leaving the 12 that the app reaches. The 30 matching
     dependencies are gone. `workbox-window` stays: `virtual:pwa-register` imports it at build time.
     The initial main chunk did not shrink until the item 1 split, but the CSS chunk fell from 141 kB
     to 79 kB (22 to 13 kB gzipped) once Tailwind stopped scanning dead files. The under-400 kB target
     was met with the split and lazy loading.
3. Add ESLint (`typescript-eslint` + `react-hooks`) and `prettier --check` to CI. Run
   `prettier --write` once in its own commit.
   - Done: both run locally and in CI; the repository was formatted in one commit.
4. Read saved state synchronously (`useState(loadState)`) so the first paint is not a blank screen,
   and make the daily count reset at midnight while the app is open.
   - Done.
5. Replace `sort(() => Math.random() - 0.5)` shuffles with Fisher–Yates (`lib/shuffle.ts`).
   - Done.
6. Housekeeping (done): deleted `.gitkeep` and the one-shot `scripts/*elevenlabs*.mjs` activators
   (kept the generator), and moved `scripts/test-srs.test.ts` to `client/src/lib/srs.test.ts`.
7. Keep the roadmap honest: this file is the backlog. No second list.

## Phase 3: Content quality — content trust

The imported Essential 600 examples, translations and usage notes were written by a model and have had
no human review. That is the largest content risk: content is the only defect code cannot repair later
for an existing user, and it is the one the 30-day retention number will be blamed on if it goes wrong.
So this phase buys evidence first, then fixes only what the evidence proves.

Two facts shape the plan:

- **No new audio spend is needed.** The generator speaks `card.front` only
  (`scripts/generate-elevenlabs-audio.ts`), never the example or usage note. Rewriting sentences is
  free.
- **The audit is the sizing input.** Until the error rate is known, "review the remaining deck in
  batches" is unbounded. Doing fixes, theming or ordering first is guessing.

Order: harness → baseline audit → sample fixes → systemic batches → curated rewrites. Each numbered
task is one PR.

1. **Audit harness** (`scripts/audit-content.ts`).
   - Deterministic sampler over the imported deck: `--limit 50 --seed 1`, seeded Fisher–Yates, so the
     same seed always emits the same sheet. Emit Markdown with id, front, back, romanization, part of
     speech, example, `exampleEnglish`, usage note and source row.
   - Write only under `docs/audits/`; never modify deck data.
   - Acceptance: two runs with the same seed produce identical rows; the sheet contains exactly `limit`
     ids that exist in the deck.
   - Done: `pnpm audit:content --limit 50 --seed 1` writes a Markdown table from a seeded
     Fisher–Yates shuffle, and the writer refuses any path outside `docs/audits/`. The seed-1 sheet is
     committed as `docs/audits/essential-sample-1.md` so the baseline audit works from a fixed sample.
     `scripts/audit-content.test.ts` covers repeatability, sample size, deck membership and the path
     guard.
2. **Baseline audit of 50 imported cards.**
   - Score each card against a fixed five-point rubric: translation accuracy, Korean naturalness,
     politeness consistency, part of speech, and romanization/batchim.
   - Commit verdicts as `docs/audits/essential-sample-1.json`, one entry per card:
     `{ id, source, verdict: "pass" | "fix", issues: [] }`. Record the error rate and the top three
     systemic issues in this file.
   - The auditor is a second model (DeepSeek V4.1 Flash, never the authoring model) plus a Korean
     speaker spot check of 10 of the 50 for calibration. Treat the model pass as a screen for grammar,
     tags and translations, not as a substitute for a native reader.
   - Decision rule: 50 cards gives a rough rate, not a precise one. If 3 or more of 50 fail (6%+),
     audit a second 50 before scoping fixes. If fewer than 3 fail, fix the sample and re-sample after
     the systemic fixes rather than auditing all 504.
   - Acceptance: a verdict exists for all 50 ids, a test asserts each id exists in the deck, and this
     section states the measured error rate.
   - Result (2026-10-31): the first sample fails 15 of 50 (30%) — nine descriptive words tagged as
     verbs, four misleading usage notes, and four unidiomatic examples or narrowed translations. The
     second sample fails 11 of 50 (22%); combined, 24 of 96 unique cards fail (25%). Four cards appeared
     in both samples and the verdicts agreed on all four. The same three systemic issues dominate
     (11 unique adjectives tagged as verbs, 7 misleading usage notes, 6 unidiomatic examples or narrowed
     translations), so the rate is confirmed and fixes are now in scope. The verdicts are in
     `docs/audits/essential-sample-1.json` and `essential-sample-2.json`;
     `scripts/audit-verdicts.test.ts` checks both against their sheets and the deck. The Korean-speaker
     spot check of 10 cards was completed on 2026-10-31: it passed, with no blocking defects found and
     some wording still worth a later naturalness polish.
3. **Fix the audited sample.** One PR, split if it exceeds ~400 lines.
   - Fix every card marked `fix`, then re-run the sheet and mark the verdicts resolved (`resolvedAt` or
     `verdict: "pass"` with the issue list kept for the record).
   - Acceptance: no open `fix` verdicts remain in the sample file; deck tests and the romanization lint
     pass; a re-audit of the same 50 finds no remaining errors.
   - Done (2026-10-31): all 24 unique `fix` cards were corrected — 11 adjectives retagged, 7 usage notes
     rewritten, 6 examples/translations repaired, and the two headword spellings fixed (`오렌지색`,
     `첫 번째`) with both voice clips regenerated. Verdicts now carry `resolvedAt` and `resolution`, and
     a `reaudit` block records zero open fixes. `audit-verdicts.test.ts` enforces both and guards the
     corrected tags and headwords. The sheets were regenerated from the same seeds and read clean.
4. **Systemic fixes in batches.** Only the issue types step 2 proved exist — politeness drift, wrong
   part of speech, batchim romanization, translation mismatch. 25–50 cards per PR, scored against the
   same rubric.
   - Acceptance: per batch, `data.test.ts` and the romanization lint pass, the batch re-audits clean,
     and the PR stays under ~400 lines.
   - Done (2026-10-31): two batches. Batch 1 retagged the 40 remaining imported adjectives
     (479–486, 488–496, 499, 501–503, 509–515, 521–524, 526–529, 531–535) from `verb` to `adjective`.
     Batch 2 rewrote 50 misleading usage notes: false sense claims (새/새로, 약/약속, 공/공공, 쏘다/보내다,
     밀다/미루다 and others), reversed or wrong register claims (양복/정장, 저의/제, 당신, the month names),
     nonstandard forms presented as standard (노랑색, 쥬스, 볼팬, 얼음, 차겁다) and garbled notes.
     `essentialPartOfSpeech.test.ts` and `usageNotes.test.ts` guard both batches. Review also repaired
     examples with broken ㅂ-irregular conjugations (두껍아서, 어둡아요) and two nonsensical sentences.
5. **Rewrite the weak curated examples.** `영어를 도와주세요`, `넷은 너무 많아요`, and the repeated
   `나는…` place sentences; keep `exampleEnglish` in sync.
   - Add a guard test: a banned-phrase list must not reappear, and the `나는 ` sentence template may
     not be used more than twice.
   - Acceptance: the named cards are rewritten with matching translations, and the guard test fails if
     a banned phrase returns.
   - Done (2026-10-31): 40 curated examples were rewritten so `나는 ` opens 2 sentences instead of 40.
     `surv_007` now reads `이 문제를 풀 수 있게 도와주세요.` and `num_004` reads `우리 가족은 넷이에요.`,
     with the number example synced in `alphabet.ts`. `curatedExamples.test.ts` bans the old phrases
     and caps the template at two.
   - Post-close review (2026-10-31): reviewing #31–#33 found eight residual defects, all fixed.
     Three headwords still carried their misspellings while the new notes called them misspellings —
     `노랑색` → `노란색` (069), `쥬스` → `주스` (171) and `볼팬` → `볼펜` (215) — so both voice clips
     were regenerated for each. Five sampled cards were repaired too: the tongue example (262) now
     uses `제 혀를 살펴보셨어요`, the vowel example (336) uses the vowel letters `ㅏ, ㅑ, ㅓ, ㅕ`
     instead of syllables, the ugly example (506) no longer insults an actor, the ring gloss (518) no
     longer repeats "to wear", and `나뭇잎` (300) now romanizes as `namunnip` via a documented lexical
     exception for ㄴ 첨가. `phase3Followup.test.ts` guards the content fixes and `data.test.ts`
     covers the romanization exception.

Already done, keep it: `data.test.ts` asserts that every study-ready card has a manifest entry and both
audio files on disk, which covers the old item 5.

Out of scope for this phase: theming the imported deck (step 4 is still editing those cards, so tagging
now would churn, and themes only pay off once a frequency signal exists), frequency ordering, new
audio, deck expansion, and FSRS. Phase 4 (Playwright smokes, hashed audio, device checks) follows.

## Phase 4: Delivery and accessibility

1. Accessibility pass: contrast on `slate-300`/`slate-400` text at 9–11px, `lang="ko"` on Korean text,
   focus rings on the dashboard's `motion.button` cards, labelled icon-only controls, `aria-live` on
   grading feedback. Re-check in a real browser, including the practice overlays.
   - Partly done: `lang="ko"`, `slate-500` for the small text, chart role/label, reduced-motion handling,
     dialog descriptions and explicit `focus-visible` rings on the dashboard cards, practice cards,
     choice buttons and text links shipped. Every icon-only control already carries a label, and the
     Scenario verdict now announces through `aria-live` like Listening and Study. The smoke suite also
     caught the Settings dialog overflowing a laptop-height viewport, so it now scrolls like Stats does.
   - Done (2026-10-31): `e2e/accessibility.spec.ts` scans the dashboard, the study front/back/summary,
     Browse, Stats, Settings, Hangul and all three recognition overlays with `@axe-core/playwright`
     (WCAG 2.0/2.1 A and AA) against the production build, with seeded progress so every surface has
     real data. It found and this PR fixed: two unnamed dashboard progress bars (the Radix root now
     also receives `value`, so screen readers get the real percentage), low-contrast header and Stats
     labels in orange/yellow/emerald/cyan/amber, the pulsing "Tap to reveal" hint at 2.3:1, dimmed
     Hangul category subtitles, a Stats category list with no keyboard access, and a Browse play
     button whose `aria-label` dropped its visible "Speak" text. All five scans pass, so the browser
     and overlay checks are now repeatable rather than manual. `e2e/accessibility-semantics.spec.ts`
     extends that to the semantics axe cannot check: the Space/1/2/3/Escape study flow, accessible
     names on the dialog and grade buttons, live-region announcements, Tab/Enter reach on the dashboard
     cards and arrow-key scrolling of the Stats category list. A human screen-reader pass
     (VoiceOver/NVDA) and the real-iPhone checks remain.
2. Vercel headers: long-lived immutable caching for `/assets/*` and hashed audio, a modest `max-age` for
   `sw.js`, and baseline security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`).
   - Done: `vercel.json` ships a CSP, `X-Content-Type-Options: nosniff`,
     `Referrer-Policy`, `Permissions-Policy` and `X-Frame-Options`. `/assets/*` and every content-hashed
     `/audio/*.mp3` are immutable for a year, `audio/index.json` and `sw.js` plus `index.html` are
     `no-cache`. The iOS standalone meta tags ship in `index.html`.
3. Audio delivery: content-hashed filenames so a regenerated clip cannot be served stale, and decide
   whether 26 MB of mp3s keeps living in git (repo is 48 MB) or moves to object storage or LFS.
   - Decision (2026-10-31): the ~26 MB library stays committed to git for now; it keeps the Vercel
     deploy and offline cache simple, with no extra host or credentials. Revisit if clone/CI checkout
     or deploy size becomes a burden, or if regenerated clips cause merge conflicts on most audio
     changes.
   - Done (2026-10-31): every clip is named `<base>.<sha256-8>.mp3`, so a regenerated clip changes its
     URL and no browser, service-worker or CDN cache can serve the old bytes. `pnpm audio:hash`
     renames the library and rewrites `audio/index.json`; the generator calls the same routine at the
     end of a run. `data.test.ts` verifies each filename against its bytes and checks every index entry
     exists, and `/audio/*.mp3` is now immutable for a year while `index.json` is `no-cache`.
4. Playwright smoke tests: study loop, Browse search and play, import/export, offline shell reload.
   - Done (2026-10-31): `playwright.config.ts` builds the app and serves it with `vite preview`, and
     `e2e/` holds five smokes: the full three-card daily loop driven by Space and `2` (with the saved
     card states, XP and review log checked), the same-session retry after `Again`, Browse search plus
     the requested vocabulary clip, an exported progress file imported back, and an offline reload that
     still serves the shell, `audio/index.json` and a Hangul clip from the precache. A separate CI job
     installs Chromium and runs `pnpm test:e2e`, uploading the report on failure. The suite found the
     Settings dialog overflow fixed in item 1.
5. Verify on a real iPhone: first-tap audio, install, offline, update notice.
   - Partly done (2026-10-31): `e2e/iphone.spec.ts` runs in a WebKit iPhone 15 project and covers a
     real tap requesting the pronunciation clip with no audio error, the iOS Home Screen meta tags and
     standalone manifest, the one-time install hint after the first graded card, offline precache and
     service-worker registration on WebKit. The update notice needs a second production build and
     cannot be simulated in one suite run, so it stays manual. Hardware audio, an actual Home Screen
     install and the update toast still need a real iPhone.

## Phase 5: Tune from real data (after 30 days)

Only after Phase 1 has produced a review log:

1. Retention first: if learners forget too much, reduce `Good` growth before changing the daily goal.
2. Workload second: if queues grow, revisit the 90-day cap and `Easy` growth.
3. Mastery last: adjust the `Known` threshold only after reviewing accuracy by card age.
4. Consider FSRS (`ts-fsrs`) if the simple model underperforms. Do not tune from XP or streaks; those
   measure motivation, not memory.

---

## Reference: the scheduler

Deliberately simple, explainable, and tested.

Each card tracks `interval` (days), `easeFactor` (1.3–3.2), `consecutiveCorrect`, `lapseCount` and
`lastResponseTimeMs`. Missing fields on old saves use conservative defaults, so no progress is lost.

| Rating | First review | Later                   | Meaning                        |
| ------ | -----------: | ----------------------- | ------------------------------ |
| Again  |        1 day | reset to 1 day          | Retrieval failed; rebuild soon |
| Good   |       2 days | `interval × ease`       | Successful effortful recall    |
| Easy   |       4 days | `interval × ease × 1.3` | Immediate, confident recall    |

- Intervals are rounded and capped at 90 days (temporary; revisit with real data).
- A lapse lowers ease by 0.2; `Easy` raises it by 0.15.
- Response time is secondary: over 12 seconds trims growth slightly, a fast answer never overrides an
  honest `Again`.
- Same-day re-grading does not compound the interval; only a fresh lapse can change a card already
  reviewed today.
- `Known` requires 3+ reviews, 75%+ accuracy, a 7-day interval and 2 consecutive correct recalls.

The daily queue only reviews cards on their due date; reviewing a card early does not advance its
schedule. Weak Words and Learning Review remain explicit extra practice on top of that queue.

## Reference: deck provenance

- Source: `The600EssentialKoreanWords.xlsx`. 547 valid rows, 542 unique headwords after fixing source
  typos (`자정거` → `자전거`, `놉다` → `높다`).
- Genuine homonyms stay separate cards: 차, 눈, 공, 병, 달, 배, 다리, 열, 분.
- Senses that duplicate curated cards were dropped, leaving 504 imported cards. The curated deck of
  136 cards remains study-ready with reviewed examples and audio; together the deck has 640 cards.
- Romanization is generated by `romanize.ts` (Revised Romanization) and linted by `data.test.ts`.
- Audio: ElevenLabs, two voices (Yong Gyu, Jini), one clip per card per voice in `public/audio/`.

## Deferred, not decided

Accounts and sync, push reminders, sentence-level audio, grammar lessons, a real TTS fallback,
multi-deck user imports, and any paid tier.

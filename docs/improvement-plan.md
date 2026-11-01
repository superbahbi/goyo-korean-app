# Goyo improvement plan

This is the single source of truth for what to build next. It replaces the old
`roadmap.md`, `phase-1-content-audit.md` and `srs-recall-quality.md`; their still-relevant
content is folded in below (the SRS model and the deck provenance are reference sections).

Every stage is done only when its gate passes.

## Product

- Free public web app. The maintainer is the first user, so the app is tuned on one real learner first.
- Learner: English-speaking beginner. TOPIK I is the ceiling, grammar lessons included (Phase 6).
- Success: users still reviewing 4+ days a week after 30 days.
- Budget: a few hours a week and little or no new audio spend.
- No accounts or backend. Progress lives in `localStorage` and moves by JSON export/import.
- Vercel Web Analytics and Speed Insights for aggregate, cookieless page views and Core Web
  Vitals (enabled 2026-10-31). Retention is still measured locally and by checking in with testers;
  no accounts and no personal data.

## Current state

Verified on 2026-11-01 on `main` after the Phase 6 practice-shell merge (`#58`):

| Check              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit`     | Passes                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `eslint .`         | Passes                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `prettier --check` | Passes                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `vitest run`       | 252 tests pass in 26 files (scheduler, queue, saved state, review log, study days, deck data, XP, audio, audit sampler, audit verdicts, imported part of speech, usage notes, curated examples, phase 3 follow-up, imported taxonomy, grammar, grammar progress, backup status)                                                                                                                                                                                |
| `playwright test`  | 25 checks pass against the production build: seven flow smokes (study loop, failed-card retry, Browse search and audio, progress export/import, offline reload, Settings scroll, grammar lesson), six axe scans (dashboard, study, dialogs, Hangul, recognition overlays, grammar), seven keyboard/screen-reader semantics checks, and five iPhone WebKit checks (first-tap audio, iOS meta tags and manifest, one-time install hint, offline, service worker) |
| `vite build`       | Passes. Main chunk 117.1 kB (34.4 kB gzipped), with React, vendor, motion and Radix in separate vendor chunks; Essential 600 lazy-loaded as its own 226 kB chunk                                                                                                                                                                                                                                                                                               |
| CI                 | Type check, lint, format check, tests, build and the Playwright job (Chromium and WebKit) are green on `main`                                                                                                                                                                                                                                                                                                                                                  |

All gates pass.

Phase 6 shell merge (2026-11-01, `#58`): the seven practice modes now share one `PracticeShell`
(prompt, verdict, feedback, complete states) instead of six near-duplicate layouts, and the study
loop was moved onto the same primitives. Dark mode followed in the same window: system, light and
dark options backed by `next-themes`, with a dashboard toggle and reduced-motion-safe transitions.
The dashboard itself was simplified into clear practice and theme sections (`#53`), and Settings
gained a reload button (`#51`).

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
and usage notes plus the curated examples are now guarded by tests. The Playwright suite covers an
iPhone-class WebKit engine plus the keyboard and screen-reader semantics that axe cannot check.

What is open: the Korean wording still has room for a later naturalness polish (see Phase 3 — content
trust). Audio is 27 MB of the roughly 53 MB clean clone (26 MB of tracked files plus a 27 MB pack).
The 300-line target holds for almost all UI
code; `components/FlashCard.tsx` is 314 after the sentence-audio control moved in, and the data and
shared modules remain larger: `essentialVocabulary.ts` (7.7k lines) and `vocabulary.ts` (1.7k) are
deck data, and `grammar.ts` (594), `useStudyState.ts` (586), `essentialTaxonomy.ts` (566),
`essentialFrequency.ts` (523), `alphabet.ts` (493), `audioPlayer.ts` (443) and `romanize.ts` (314)
are over 300.

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

| Phase                               | State                                                                                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Repairs                           | Done (#2–#7); browser, iPhone and screen-reader checks done                                                                                                                                              |
| 1 Learning loop and measurement     | Done (#9–#15); browser checks signed off; item 5 done                                                                                                                                                    |
| 2 Structure                         | Done; main chunk 117.1 kB raw / 34.4 kB gzipped with vendor chunks; one component over 300 lines (`FlashCard` 314)                                                                                       |
| 3 Content                           | Done; five tasks, a post-close review and a Korean-speaker spot check complete; naturalness polish deferred                                                                                              |
| 4 Delivery and accessibility        | Done; headers, iOS meta, `lang`, contrast, focus rings, 25 Playwright checks (Chromium plus WebKit iPhone) and hashed audio; human screen-reader and real-iPhone checks done                             |
| 5 Tune from data                    | Blocked on 30 days of use; window opened 2026-11-01, so the earliest honest read is around 2026-12-01                                                                                                    |
| 6 Sentence audio and grammar        | In progress; sentence audio wired with 56 male clips (20 deck + 36 grammar) and 0 female; 12 lessons ship, Korean review open                                                                            |
| 7 Content trust completion          | In progress; re-measured 2026-11-01 at 10.4% of 96 (down from 25%) and fixed the 10 defects it found; the 319-card sweep and the deferred naturalness polish are open, Korean-speaker spot check pending |
| 8 First session and card experience | Done (#60–#62 plus the first-run follow-up); mobile card fits, intervals on grade buttons, first-run start block, new-word intro                                                                         |

Phase 0 is merged: offline audio (#2), local environment (#3), visible audio failure (#4), real
settings (#5), protected progress (#6) and the update notice (#7). Its browser checks passed on
2026-10-31: blocking `*/audio/*` showed the fallback and the session continued, auto-play off stayed
silent until the speaker was tapped, and `navigator.storage.persist()` was called once after the
first grade. The iPhone install hint and update toast were covered by the Phase 4 real-device pass,
so Phase 0 has no manual checks left.

Phase 1 is merged: review log (#9), study-day history (#10), same-session retry (#11), recognition
caps (#12), keyboard shortcuts (#13), queue module (#14) and new-card pace (#15). Task 5 now orders
the imported deck by theme and frequency instead of source row order. The browser checks — keyboard
flow with a screen reader, recognition modes and the study-day stats — were signed off on
2026-10-31, so Phase 1 is closed.

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
   - Done (2026-10-31): the imported deck now carries a themed category on every card (24 categories,
     from survival and daily through time, people, food, animals, nature and adjectives) plus a
     frequency rank derived from the NIKL learner-vocabulary list. New cards follow the category
     order; curated cards keep their hand-picked order inside a theme and imported cards follow by
     frequency. NIKL ranks collapse homographs, so a few words (말, 씨) rank higher than their deck
     sense; `essentialTaxonomy.test.ts` covers theme and rank coverage, and `queue.test.ts` covers the
     ordering.
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

Out of scope for this phase: theming and frequency ordering (both shipped later with Phase 1 item 5),
new audio, deck expansion, and FSRS. Phase 4 (Playwright smokes, hashed audio, device checks) follows.

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
     cards and arrow-key scrolling of the Stats category list. The human VoiceOver/NVDA pass and the
     real-iPhone checks also passed on 2026-10-31, so Phase 4 has no manual checks left.
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
   - Done (2026-10-31): `e2e/iphone.spec.ts` runs in a WebKit iPhone 15 project and covers a
     real tap requesting the pronunciation clip with no audio error, the iOS Home Screen meta tags and
     standalone manifest, the one-time install hint after the first graded card, offline precache and
     service-worker registration on WebKit. The update notice needs a second production build and
     cannot be simulated in one suite run, so it stays manual. The manual checks on a real iPhone —
     hardware audio, an actual Home Screen install and the update toast — passed.

## Phase 5: Tune from real data (after 30 days)

The 30-day window opened on 2026-11-01 with the Phase 1 review log, so the first honest read is around
2026-12-01. Only after Phase 1 has produced a review log:

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

## Phase 6: Sentence audio and grammar lessons

Previously deferred. Order matters: sentence audio is the delivery layer, so it lands before the
grammar content that reuses it.

1. **Sentence-level audio.** Every card example gets a clip in both voices, keyed by card id under
   `sentences` / `female.sentences` in `audio/index.json`.
   - The generator gained `--sentences [--sample=N]`, which writes the clips, hashes them and records
     the index entries; the word and alphabet passes are unchanged.
   - `playSentenceAudio` resolves the selected voice and falls back to the other voice when only one
     has the clip, so a partially generated library still works. `useSentenceAudioIds` hides the
     sentence player where no clip exists.
   - UI: "Hear sentence" on the study card back and a speaker control beside each example in Browse.
   - State (2026-11-01): 56 male clips are committed — the 20-clip deck sample plus all 36 grammar
     examples. No female sentence clips exist yet (`female.sentences` is absent from
     `public/audio/index.json`), so the female voice falls back to the male clip today.
   - Cost of the full batch: 639 deck examples plus 36 grammar examples, about 12.1k characters per
     voice. At the measured 29.5 kB per sentence clip, a full two-voice library adds roughly 38 MB and
     takes `public/audio` from 27 MB to about 65 MB. That is the point where the Phase 4 decision to
     keep audio in git should be re-checked.
   - Blocked on: maintainer approval of the ElevenLabs spend, then one batch PR.
   - Acceptance for the full batch: every deck card with an example has a clip in both voices,
     `data.test.ts` passes, and the sample is spot-checked for pacing and pronunciation.

2. **Grammar lessons.** Twelve TOPIK I lessons with a short explanation, examples, and a
   two-question check, in a dashboard dialog; progress travels with the export.
   - Done (2026-10-31): `client/src/lib/grammar.ts` holds the course (copula, 은/는 vs 이/가,
     을/를, 에/에서, 있어요/없어요, -아요/어요, -고 싶어요, -(으)ㄹ 수 있어요, -고, -지만,
     -(으)세요, -았/었어요). The dialog lists progress, each lesson shows points, example sentences
     with their clips, a common-mistake note and a two-question check with explanations.
   - Progress is `grammar` in the save (schema 5): completed ids plus best score per lesson, so one
     export moves vocabulary and grammar together. Older saves load with an empty course.
   - The grammar examples are part of the sentence-audio registry (`grammar_<lesson>_<n>`), and the
     generator can refresh just those clips with `--sentences --grammar`. The 36 male clips are
     generated; the female voice follows the full batch.
   - Still needed before the phase closes: a Korean-speaker review of the twelve lessons, following
     the Phase 3 content rule. The content is model-written and not yet trusted.
   - Acceptance: the 12 lessons render, the check records a best score, an older save loads, and the
     lesson surfaces pass the axe scan.

## Phase 7: Content trust completion (after Phase 6)

Phase 3 sampled 96 of the imported cards and found 24 failing (25%). The systemic fixes landed, but
roughly 319 imported cards have never been sampled, and the naturalness polish was deferred. Content is
still the defect code cannot repair for an existing user, and it is the first thing 30-day retention
will be blamed on. This phase measures whether the fixes moved the rate, then spends only where the
evidence points.

Order matters: measure first, rewrite second.

1. **Re-measure the error rate.** Two fresh deterministic samples of the imported deck (seeds beyond
   the Phase 3 pair), scored against the same five-point rubric by a non-authoring model plus a Korean
   speaker spot check of 10 cards. Commit the verdicts under `docs/audits/` like
   `essential-sample-1.json`.
   - Decision rule: under 5% fail — fix the sample and stop; 5–15% — audit the remaining deck in
     batches; over 15% — treat the whole imported deck as untrusted before any new feature work.
   - Acceptance: a verdict exists for every sampled id, `scripts/audit-verdicts.test.ts` covers the new
     sheets, and this section records the measured rate.
   - Done (2026-11-01): two fresh deterministic samples chosen for minimal overlap with the Phase 3
     pair — seed 10 (`essential-sample-3.md/json`) and seed 61 (`essential-sample-4.md/json`). Sample 3
     fails 6 of 50 (12%) and sample 4 fails 4 of 50 (8%); combined that is 10 of 96 unique cards
     (10.4%), down from 25% in Phase 3. 89 of the 96 cards had never been audited, so 185 unique
     imported cards (36.7% of 504) now carry a verdict. Seven cards also appeared in Phase 3: the four
     that were fixes there (338, 350, 506, 520) now pass, the three that already passed still do, and
     the four cards shared by both new sheets agreed 4/4. The remaining defects are four misleading
     usage notes (섬, 곧장, 냄새를 맡다, 입다), one malformed gloss (키가 작다), two examples that do not
     use the headword or make sense (돌다, 이빨), two part-of-speech tags (밖에, 다섯번째) and two
     romanizations (다섯번째 spacing, 앉다 `anta` → `anda`). At 10.4%, the 5–15% decision applies: audit
     the roughly 319 unsampled imported cards in batches before treating the deck as trusted.
     `scripts/audit-verdicts.test.ts` now covers both sheets and recomputes the combined rate, fresh
     cards, deck coverage and mutual agreement. The Korean-speaker spot check of 10 of these cards is
     still pending, so the phase stays open.
   - Started early on 2026-11-01 because this step is read-only: Phase 6's remaining work is blocked on
     the ElevenLabs spend approval and the Korean grammar review, neither of which this measurement
     touches.
2. **Naturalness polish.** Rewrite the wording the Phase 3 Korean-speaker check flagged, plus every
   naturalness issue from the new samples, in batches of 25–50 cards. Keep `exampleEnglish` in sync,
   keep the same rubric, and reuse the Phase 3 guard-test pattern so a repaired phrase cannot return.
   - No new audio: the generator speaks headwords only, so sentence rewrites are free (Phase 3 rule).
   - Acceptance: per batch, the deck and romanization tests pass, the sheet re-audits clean, and the PR
     stays under ~400 lines.
   - Done (2026-11-01) for the ten defects the re-measurement found: the four misleading usage notes
     (섬, 곧장, 냄새를 맡다, 입다), the 키가 작다 gloss, the two bad examples (돌다, 이빨), the 밖에 and
     다섯 번째 part-of-speech tags, the 다섯 번째 spacing plus romanization, and 앉다 `anta` → `anda`.
     Fixing 앉다 also removed the transliterator's documented but wrong ㄵ+ㄷ special case, which
     claimed the ㅈ surfaces; Revised Romanization gives `anda`. `phase7Followup.test.ts` guards all ten,
     both sheets were regenerated from the same seeds, and the verdicts carry `resolvedAt`/`resolution`
     with `openFix: 0`. No clip was regenerated: the 다섯 번째 spacing and the 앉다 romanization leave the
     spoken form unchanged, and the other eight fixes are text only. The deferred Phase 3 naturalness
     polish is still open, so this step is partly done.
3. **Sweep if step 1 says so.** 50 cards per PR, same rubric and verdict format, until every imported
   card has a recorded verdict.

Out of scope: new cards, FSRS, more grammar lessons, and any UI change. Phase 5 runs alongside this
phase because it is a read-only tuning exercise.

Sequencing: full sentence batch → Korean grammar review → Phase 7 step 1 (while the Phase 5 window
closes around 2026-12-01) → Phase 7 fixes and sweep. Step 1 ran early on 2026-11-01 as a read-only
measurement; the batched audits and fixes still wait behind Phase 6's spend approval and Korean
review.

## Phase 8: First session and card experience

The first session is where a new learner decides whether to come back. Split across parallel PRs so
each surface stays small and reviewable.

1. **Mobile card layout.** Done (2026-11-01). At 390×844 the revealed card now fits Korean,
   romanization, meaning and the example without scrolling: the card uses a flexible height on
   phones (desktop keeps the 3:4 portrait card) and the footer drops from about 55% to about 16% of
   the viewport. The optional production box is collapsed behind a "Say it in a new sentence"
   disclosure, and the redundant "Tap to reveal" line is gone, leaving the card surface plus the
   labelled footer button as the only reveal path. The speaker button stays in normal flow, so it no
   longer overlaps at 320px, where the card scrolls instead.
2. **Interval labels on the grade buttons.** Done (2026-11-01). `previewIntervals` in `lib/srs.ts`
   runs the saved card state through `scheduleRecall`; the three compact grade buttons show the real
   next interval ("Again 1d", "Good 2d", "Easy 4d") for new, mature and lapsed cards. Unit tests
   cover all three.
3. **First-run home.** Done (2026-11-01). A save with no review log, no card states and nothing
   studied today opens on one "Start here" block: a single "Start first session · 3 new words"
   action, a Hangul link, and one sentence explaining that reviews return tomorrow. The all-zero
   review plan, theme grid and empty stats stay hidden until there is history, and the practice grid
   starts collapsed behind "Show all". Progress measures today's planned work ("0 of 3 planned") with
   the daily goal as a secondary line, and the welcome hero is skipped on first run so there is
   exactly one primary action. `isFirstRunState` treats a save with card states (an import or an
   older save) as history, so those keep the full dashboard.
4. **New-card introduction.** Done (2026-11-01). A never-reviewed card opens on a "New word" view —
   Korean, romanization, meaning, the example with its translation, and the pronunciation — and
   "Start practising" moves to the normal recall card for the same word. The introduction never
   grades, writes card state, logs a review, or changes the queue or schedule. New review-log entries
   carry an optional `flow: "v2"` marker so the Phase 5 analysis can segment cohorts.

Acceptance: the revealed card fits at 390×844 and stays usable at 320px, the grade labels match the
scheduler, the session offers one reveal path, and the local gate plus the e2e suite are green.

## Deferred, not decided

Accounts and sync, push reminders, a real TTS fallback, multi-deck user imports, and any paid tier.

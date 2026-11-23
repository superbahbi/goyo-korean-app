# packages/domain/src/

## Responsibility

The pure domain layer of Goyo: types, content datasets, and framework-free functions that turn a
Grade into scheduling, XP, Daily goal progress, and dashboard state, plus the Audio manifest,
grammar/alphabet content, and the saved-progress format. No React or JSX; browser APIs are injected
(`AppReloadEnvironment`, `AudioIndexDependencies`, `AudioElementEnvironment`, `clock`) or confined to
thin singletons (`audioIndex`, `audioPlayer`, `progressStorage`).

This is a workspace package, imported as `@domain/*`. Every surface — the web client
(`apps/web/`) and the mobile UI (`mobile/`) — depends on it, and nothing depends on it in the
other direction.

## Design

**Scheduling (SRS)** — `srs.ts`. `scheduleRecall` is SM-2-derived and conservative: ease clamped
1.3–3.2 (default 2.35), a 90-day interval cap, `again` always due tomorrow, first-review intervals
of 2/4 days, slow responses (>12 s) costing ease/quality. `scheduleReview(existing, rating, today,
ms, { recognition })` adds the same-day guard (re-grading today cannot compound an interval; only a
fresh lapse moves it) and caps Recognition practice so it can never stretch a schedule.
`previewIntervals` reads the same function, so grade-button labels cannot drift from what is saved.

**Grade intent and outcome** — `gradeIntent.ts` + `gradeOutcome.ts`. A `MODE_POLICY` strategy table
keyed by the six Practice modes (`daily`, `weak`, `learning`, `listening`, `scenario`, `shadowing`)
decides `updatesSchedule`, `recognition`, `xpEligibility`, `repeatability`, and
`repeatXpMultiplier`. `evaluateGrade` returns one `GradeDecision` (`schedule | null`, `advanced`,
`countsAsNewCard`, `xp`, `goalJustReached`, `repeatable`); `goalProgress`/`repeatableSession` cover
the Daily goal and "Practice again", while `XP_BY_RATING` is again 5 / good 10 / easy 15 and daily
Repeat practice pays half. `applyGradeOutcome(state, cardId, rating, { mode, responseTimeMs })` is
the single pure transition: it logs the Grade, updates `cardStates`, `stats` (XP, level, streaks,
`totalCardsLearned`), `studyDays`, and returns `{ state, outcome }`. Practice-only modes (shadowing)
log without moving schedule, XP, or progress, so the toast and the save read one decision.

**Mastery, XP, day math, history** — `mastery.ts` (`CardState`, `getMasteryState`: new → learning →
shaky → known by review count, accuracy 0.5/0.75, interval 7, streak 2), `xp.ts` (`levelFromXp =
⌊√(xp/100)⌋+1`, `xpToReachLevel`, `levelTitle`, `levelProgress`), `day.ts` (local `YYYY-MM-DD`
keys, `addDays`, `msUntilNextLocalMidnight`), `studyDays.ts` (`recordStudyDay`, `deriveStreak`,
`daysStudiedWithin`, `reviewsWithin`, `migrateLegacyDay`), `reviewLog.ts` (`appendReviewEntry`,
5 000-entry cap, `flow: "v2"`).

**Queue and forecast** — `queue.ts`. `buildDailyQueue(cards, states, today, dailyGoal, studiedToday,
newCardsPerDay = 3)` puts due reviews first (oldest due date), then a themed batch of unseen cards
(theme order from `CATEGORIES`, then `frequencyRank`), deduped and sliced to
`goalProgress().repeatQueueSize`; no new cards once the Daily goal is met. Siblings:
`selectWeakCards`, `selectShadowingCards`, `selectLearningCards`, `selectRecognitionCards`
(reviewed-only ordering), `preferNotReviewedToday`, `countOverdue`, `buildReviewForecast`,
`summarizeForecast` (balanced/busy/heavy), `nextScheduledReview`.

**Dashboard composition** — `dashboardView.buildDashboardView` is the facade composing focused
builders: `dashboardStats.buildDashboardStats` (mastery counts, review accuracy, median response
time, per-category coverage), `dashboardPlan` (`buildTodayPlan`, `buildModeAvailability`,
`RECOGNITION_MIN_CARDS = 4`), `dashboardProgress` (`describeTodayProgress` — progress against
today's planned work, not the goal; `isFirstRunState`), and `dashboardForecast`
(`buildDashboardForecast`: 7-day forecast with overdue on day one, 30-day outlook). All take an
injected `labelDate`, keeping locale formatting at the React edge. `dialogLauncher.ts` models at
most one open Dialog request: `DIALOG_KINDS`, the `DialogRequest` union, `NO_DIALOG`, and pure
`reduceDialog` (open replaces, close clears).

**Session and question machines** — `studySession.createStudySession` owns the Session queue, card
index, Grade lock, recall latency, one-retry growth, intro phase, and restart behind
`getState`/`subscribe` plus commands (`dismissIntro`, `setRevealed`, `grade`, `cardShown`,
`restart`, production mutators, `close`, `dispose`), with injected `clock`, `isNewCard`, `onGrade`,
`stopAudio`, `onClose`. `studyKeys.ts` maps keys to commands per `StudyPhase` (`STUDY_KEYMAP`,
`studyKeyCommand`, `STUDY_KEY_HINT`). `practiceQuestion.createQuestionLoop<TQuestion>` is the
generic Question loop (`answer`, `next`, `restart`, a whole-round `buildRound`); `practiceVerdict`
derives `describeVerdict` and `ratingForVerdict` (correct → good, wrong → again);
`practiceDistractors.pickDistractors` takes each mode's `count`, `dedupeKey`, and `preferTag`.

**Content** — `vocabulary.ts` (`VocabularyCard`, 24 `CATEGORIES`, 136 curated `CURATED_CARDS`,
`CURATED_STUDY_READY`; `loadVocabularyDeck` lazy-imports the imported deck), `essentialVocabulary.ts`
(504 words with theme and frequency applied on map), `essentialTaxonomy.ts`,
`essentialFrequency.ts`, `alphabet.ts` (40 Hangul cards, audio clip aliases), `hangulStrokes.ts`
(stroke-order SVG paths), `grammar.ts` (18 `GRAMMAR_LESSONS`, `grammarExampleId`,
`GRAMMAR_SENTENCE_LINES`), `grammarCourse.ts`, `grammarProgress.ts` (sanitizers, best-score
`recordGrammarAttempt`), `romanize.ts` (Revised Romanization).

**Audio** — `audioIndex.ts` is the Audio manifest boundary: `parseAudioManifest`,
`resolveVocabularyClip` / `resolveSentenceClip` (cross-voice fallback) / `resolveAlphabetClip` (id
then alias), `planAudioDownload`, and `createAudioIndexStore` (`peek`, `get` one shared fetch,
`prefetch`, `warm` — fetch `?warm=1` and store under the real URL only on 200 + `audio/*`,
`forget`), with `fetch`/`caches` injected. `audioCache.ts` names the bucket (`goyo-audio-v4`).
`audioElement.createAudioElementPlayer` owns the element lifecycle and one retry after evicting a
corrupt cached clip, with `PlaybackStoppedError` separating stop from failure. `audioPlaybackState`
is a tiny external store (`subscribeAudioPlayback`, `showPlayingClip`); `audioPlayer` is the facade
over resolution plus playback (`playVocabularyAudio`, `playAlphabetAudio`, `playSentenceAudio`,
speaker selection, `stopAudio`).

**Persistence, backup, PWA** — `savedState.ts` is the one save format (`SCHEMA_VERSION = 5`;
`parseSavedState` with per-field sanitizers, `loadSavedState` with the newer-save guard,
`buildExportPayload`, `validateImportPayload`). `progressStorage.ts` owns the localStorage key and
reset; `backupStatus.ts` tracks local export age; `storageProtection.ts` handles iOS install hints
and persistent-storage requests. `appReload.reloadToLatestApp` is the waiting-worker handshake
(`SKIP_WAITING`, `controllerchange`, timeout); `pwaConfig.PRECACHE_GLOBS` feeds vite-plugin-pwa;
`voiceAvailability` gates the paused female voice; `utils.cn` merges classes.

## Flow

- **Grade**: card UI → `useStudyState.gradeCard` → `applyGradeOutcome` → `evaluateGrade` →
  `scheduleReview` → `GradeDecision` → next `UserState` (schedule, XP/level, streaks, `studyDays`,
  `reviewLog`) plus `{ xp, goalJustReached, repeatable }` for the toast → JSON to localStorage.
- **Dashboard**: `UserState` + deck (curated immediately, imported via `loadVocabularyDeck`) →
  `buildDashboardView` → `pools` (queue, recognition, weak, learning), `modes`, `today.plan`,
  `stats`, `review`, `dialog` → Home sections, Stats dialog, and practice launchers.
- **Study session**: queue → `createStudySession` → derived phase `intro | recall | revealed |
completed`; `grade` clamps latency to 250–120 000 ms, sets the Grade lock, appends a lapsed card
  once, calls `onGrade`; `cardShown` releases the lock after the next card paints.
- **Practice**: `buildRound` → `createQuestionLoop` → `answer` → `next` → `describeVerdict` →
  `applyGradeOutcome(..., { mode })`.
- **Audio**: `/audio/index.json` → `parseAudioManifest` → resolver → element `play` → best-effort
  `warm` into the Cache API; the service worker precaches the manifest itself. **Reload**:
  registration → waiting worker → `postMessage(SKIP_WAITING)` → settle on
  activation/`controllerchange`/3 s timeout → `reload()`.

## Integration

Internal imports use the `@domain/*` alias (relative paths inside the audio cluster). The only
third-party runtime imports are `clsx` and `tailwind-merge` in `utils.ts`. Consumers:

- `../hooks` — `useStudyState`, `useHomeDashboard`, `useHomeSessions`, `useDialogLauncher`,
  `useAudioPlayback`, `useSentenceAudioIds`, `useVocabularyDeck`, `useLocalDay` (savedState,
  gradeOutcome, dashboardView, dialogLauncher, audioPlayer).
- `../components` — `StudySession`, `study/*`, `practice/*`, `ListeningPractice`,
  `ScenarioPractice`, `ShadowingPractice`, `BrowseDialog`, `dialogs/registry.tsx`, `settings/*`,
  `grammar/*`, `stats/*`, `ui/*` (`utils.cn`). `../pages` — `Home`, `AlphabetPractice`.
- Repo root `vite.config.ts` — `pwaConfig.PRECACHE_GLOBS`, `audioCache.AUDIO_CACHE_NAME`.
- `../../shared` — `packages/shared/storage.ts` adapts `savedState`, `gradeOutcome`,
  `grammarProgress` and `progressStorage` to a platform storage.
- `../../mobile` — `mobile/src/context/GoyoMobileContext.tsx` and mobile components import the
  domain directly by relative path; `mobile/tsconfig.json` includes `../packages/domain/**/*.ts`.

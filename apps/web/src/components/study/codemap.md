# apps/web/src/components/study/

## Responsibility

The recall-card presentation and React binding for one Study session. It shows
a NewCardIntro before a card's first test, the optional ProductionAttempt
panel, the three GradeActions with real interval previews, and the session
summary. `useStudySession` adapts the framework-free Session machine to React;
no component here decides queue, schedule, or XP. Grade intent and persistence
remain with the parent that supplies `onGrade`.

## Design

- **Adapter over a Session machine.** `useStudySession({ queue, cardStates,
onGrade, onClose })` lazily creates `createStudySession` once and subscribes
  via `useSyncExternalStore`. Callback and `cardStates` refs keep the machine
  stable while exposing current values.
- **Grade lock release by effect.** A `useEffect` on `state.index` calls
  `session.cardShown()`; the machine stays `gradingLocked` from a Grade until
  the next card has rendered, so a double click cannot grade twice.
- **Declarative keyboard binding.** One window `keydown` listener calls
  `studyKeyCommand(event, phase)` from `@domain/studyKeys`, ignores modified or
  repeated keys and editable targets, honours `defaultPrevented`, and lets
  `[data-intro-audio]` keep native Space/Enter activation. Commands map to
  `close`, `dismissIntro`, `setRevealed`, and `grade`.
- **Presentational contracts.** `GradeActions` maps a static `GRADES` table
  over `IntervalPreview` (`again`/`good`/`easy` in days) and reports
  `SrsRating` through `onGrade`. `NewCardIntro` is a non-grading teaching step
  with `useAutoPlayOnce` and replay/sentence controls. `ProductionAttempt` is
  controlled and optional. `StudySessionSummary` projects `StudyResults` and
  `retryCount` onto the shared `PracticeComplete`.

## Flow

`queue` and saved `cardStates` enter the machine; `phase` derives as `intro`
when the card has no saved state and was not introduced this session, otherwise
`recall`/`revealed`/`completed`. Intro acknowledgement starts the recall clock;
reveal captures latency once; grading clamps it (`clampResponseTime`) and calls
`onGrade(cardId, rating, { responseTimeMs })` before advancing. An `again`
Grade appends that card once at the queue tail and raises `retryCount` without
reordering the rest. Completion yields `StudySessionSummary`; restart replays
the original queue, not the retry-grown one. Unmount calls `session.dispose()`
to stop audio.

Returned surface: `index`, `sessionQueue`, `currentCard`, `showIntro`, `flipped`,
`completed`, `results`, `retryCount`, `production*`, `dismissIntro`,
`handleFlip`, `handleGrade`, `restartSession`, `closeSession`,
`toggleProduction`, `setProductionAttempt`, `markProductionDone`.

## Integration

Imports `@/components/practice/{PracticeShell,PracticeComplete}`,
`@/components/ui/{button,input}`, `@/hooks/useAutoPlayOnce`,
`@/hooks/useSentenceAudioIds`, and `@domain/{studySession,studyKeys,srs,mastery,
vocabulary,audioPlayer}`.

The sole consumer is `../StudySession.tsx`, which also supplies `FlashCard`,
computes `previewIntervals`, and composes the shell footer. Cross-references:
`../practice` for the shell and completion screen, `@domain/studySession`,
`@domain/studyKeys`, `@domain/srs`.

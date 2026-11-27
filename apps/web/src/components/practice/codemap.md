# apps/web/src/components/practice/

## Responsibility

The shared presentation layer for every practice mode. It supplies one
full-screen dialog shell, one answer-choice widget, one post-answer verdict
block, one completion screen, and the React adapter for the framework-free
Question loop. Modes compose these parts instead of re-implementing chrome,
verdict semantics, or scoring. This folder owns presentation and wiring only;
scheduling and XP live behind `onGrade` callbacks in the mode containers.

## Design

- **Facade shell.** `PracticeShell` wraps shadcn `Dialog` in a non-dismissible
  full-screen surface with header (close, optional back, progress, counter),
  scrollable `main`, and optional footer. `PracticeTone` is an eight-value union
  mapped to gradients by `practiceToneBackground`; `PracticePrimaryButton`
  standardises the footer action.
- **Adapter over a command machine.** `useQuestionLoop<TQuestion extends
PracticeQuestion>` lazily constructs `createQuestionLoop` and subscribes with
  `useSyncExternalStore`; it exposes `state`, `current`, `verdict` (from
  `describeVerdict`), `answer`, `next`, `restart`. The machine owns index,
  selection, verdict, score, completion, and restart.
- **Data-driven ratings.** `describeVerdict` supplies `correctId`, `answered`,
  `isCorrect`, `isLast`, and a `PracticeRating`; containers map that rating to a
  Grade through `ratingForVerdict` rather than re-comparing choices.
- **Presentational contracts.** `ChoiceButton` has one prop contract for all
  modes (letter, label, `answered`, `chosen`, `correct`). `PracticeFeedback`
  keeps an always-mounted `aria-live="polite"` region and accepts class and
  action slots. `ListeningPrompt`, `ScenarioPrompt`, and `PracticeComplete`
  are stateless.
- `scenarios.ts` exports `SCENARIOS`, a data table of `{ id, place, prompt, cardId }`; its `Scenario`
  interface is module-local and not exported.

## Flow

1. A mode container calls `useQuestionLoop(buildRound)`; `buildRound` runs once
   and again on restart, producing a fresh ordered round with fresh
   distractors.
2. A choice click calls `answer(choiceId)`; the loop ignores it when already
   answered, records `selectedId`/`verdict`, and increments `correctCount` on a
   correct answer.
3. The container reads `verdict` to render `PracticeFeedback` and, in
   recognition modes, emits `onGrade(cardId, ratingForVerdict(isCorrect))`.
4. `next()` clears the selection and advances, or marks the round `completed`
   after the last question. `restart()` rebuilds the round through
   `buildRound`.
5. On completion the container renders `PracticeComplete`, passing a restart
   action only when the mode allows Repeat practice; otherwise a single close
   action remains.

## Integration

Imports `@/components/ui/{button,dialog,progress}`, `@domain/utils`, and
`@domain/vocabulary`. Its adapter binds `@domain/practiceQuestion` and
`@domain/practiceVerdict`; containers add `@domain/practiceDistractors` and
`@domain/shuffle` for choice construction.

Consumers: sibling mode containers `../ListeningPractice`, `../ScenarioPractice`,
`../ShadowingPractice`, `@/pages/AlphabetPractice`, `../StudySession` (shell
only), `../study/StudySessionSummary` (completion screen), and
`../grammar/GrammarQuiz` plus `../grammar/GrammarDialog` (shell, choice, feedback,
and question loop). Cross-references: `../study`, `../grammar`,
`@domain/practiceQuestion`, `@domain/practiceVerdict`.

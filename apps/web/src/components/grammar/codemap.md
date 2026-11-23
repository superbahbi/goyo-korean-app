# apps/web/src/components/grammar/

## Responsibility

The grammar course browser, lesson reader, and self-check. `GrammarDialog`
presents the lesson list and one selected lesson inside the shared
PracticeShell; `GrammarLessonView` renders explanation, points, examples with
optional sentence audio, and the common mistake; `GrammarQuiz` runs the
multiple-choice check. Progress is read from and reported to the parent through
`GrammarProgress`; this folder owns no persistence.

## Design

- **Container with local selection state.** `GrammarDialog` holds
  `lessonId: string | null` and switches between the course list and a lesson
  view. It stops audio and clears the selection on close or back; it is not a
  Dialog request itself, it receives `open`/`onOpenChange` from the dialog host.
- **Composition over duplication.** Both branches render `PracticeShell`
  (`tone="teal"`) with badges, progress, a counter, and a status line. A
  `key={lesson.id}` / `key="list"` remount resets per-view state.
- **Reused Question loop.** `GrammarQuiz` adapts
  `useQuestionLoop<GrammarQuestion>` from `../practice/useQuestionLoop`, where
  `GrammarQuestion = { question: GrammarQuizQuestion; answerId: string }` and
  `answerId` is `String(question.answerIndex)`. It reuses `ChoiceButton` and
  `PracticeFeedback` (`animate={false}`, custom action slot).
- **Report-once guard.** A `reportedComplete` ref ensures `onComplete` fires
  once per completed round even if a second click lands before the result
  renders; `retake` clears it and calls `restart`, rebuilding the round.
- **Audio capability probing.** `GrammarLessonView` uses
  `useSentenceAudioIds()` and `grammarExampleId(lesson.id, index)` to show a
  play control only for examples with a generated clip.

## Flow

`progress` and `onCompleteLesson(lessonId, correct, total)` enter
`GrammarDialog`. Lesson content comes from `GRAMMAR_LESSONS` /
`findGrammarLesson`; `completedCount` is filtered against current lesson ids,
and `progress.scores[lesson.id]` supplies the best result badge. Inside a
lesson, the learner reads the pattern, optionally plays example audio, then
answers each quiz question. `answer(optionId)` records the verdict; the action
button advances or shows the result; on the last question the quiz calls
`onComplete(result.correctCount, result.questions.length)`, which
`GrammarDialog` forwards to `onCompleteLesson`. The quiz then shows its own
score card with retake. Closing or going back calls `stopAudio()`.

## Integration

Imports `../practice/{PracticeShell,ChoiceButton,PracticeFeedback,
useQuestionLoop}`, `@/components/ui/{button,badge}`,
`@/hooks/useSentenceAudioIds`, and `@domain/{grammar,grammarProgress,audioPlayer}`.

Consumers: `../dialogs/registry.tsx` lazily mounts `GrammarDialog` from a
Dialog request and passes `progress` plus `onCompleteLesson`. Grade intent is
not involved: grammar results update `GrammarProgress` only. Cross-references:
`../practice`, `../dialogs`, `@domain/grammar`, `@domain/grammarProgress`.

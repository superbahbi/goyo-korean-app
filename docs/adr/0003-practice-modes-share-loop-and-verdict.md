# 0003. Practice modes share one question loop, distractor picker and verdict

- Status: Accepted
- Date: 2026-11-02

## Context

Listening, scenario and grammar practice each re-implemented the same question state:
index, selected choice, answered verdict, score, completion and restart. Restart was
expressed by a `void round` memo trick because the restart handle was missing from the
interface. Distractor rules were copied with different counts, dedupe keys and tag
preferences, and correctness/rating was re-derived in every renderer. Grammar also
re-implemented the shared feedback block.

## Decision

`lib/practiceQuestion.ts` owns prompt index, selection, verdict, score, completion and
restart behind a small command interface. `lib/practiceDistractors.ts` is the only
distractor picker, with each mode's rules as explicit options. `lib/practiceVerdict.ts`
answers the questions renderers kept re-deriving: which choice is correct, whether the
answer was right, whether this is the last question, and which rating that verdict maps to.
Renderers render prompts and call the loop.

## Consequences

- A fourth practice mode costs a prompt renderer plus its distractor options.
- Restart is an interface concern; no memo-defeating state.
- Per-mode differences are visible as options rather than silent copies.
- Renderers must use `answerId` from the verdict, not compare against card ids or option
  indices.

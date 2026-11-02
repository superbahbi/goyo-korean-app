# 0001. Grade policy owns both the decision and the write

- Status: Accepted
- Date: 2026-11-02

## Context

A grade's intent (does the schedule move, does it earn XP, does it cross the daily goal,
is practice-again offered) and the saved-state write had separate owners. The toast path
re-evaluated the intent while `applyGrade` re-evaluated it again and wrote the card state,
XP and day count. The two calls used the same snapshot but nothing enforced that they
stayed aligned, and the repeat-practice rule lost its only caller when the dialog host was
replaced.

## Decision

`lib/gradeIntent.ts` decides the intent from a pure snapshot. `lib/gradeOutcome.ts`
applies that decision to `UserState` and returns both the next state and a small
`GradeOutcome` (`xp`, `goalJustReached`, `repeatable`, `countsAsNewCard`). Callers —
the toast, the summary, the repeat affordance — read that outcome. No caller re-runs
`evaluateGrade`, and no caller writes grade progress itself.

## Consequences

- The toast and the save cannot disagree; both come from one call.
- A new practice mode is a `MODE_POLICY` entry, not another branch in a hook.
- Grade tests are pure and need no React or localStorage.
- `useStudyState` still owns persistence: it applies the returned state and saves it.
- If an outcome is needed without a write, add a decision-only call rather than
  duplicating `evaluateGrade` at the caller.

# 0007. Card selection lives in the queue module

- Status: Accepted
- Date: 2026-11-02

## Context

The daily queue, weak-card selection and learning selection lived in `lib/queue.ts`, but
recognition-practice selection was hand-written inside `useHomeDashboard`, duplicating the
due filter, the weak-card ordering and the accuracy formula. Selection policy therefore had
two homes and one of them was a nineteen-output hook.

## Decision

`lib/queue.ts` owns every card-selection rule: daily queue, weak cards, learning cards and
recognition practice, plus the shared accuracy helper. Hooks package the results for the
dashboard; they do not select cards.

## Consequences

- Selection behaviour is tested once, in `queue.test.ts`, with characterisation tests for
  the recognition order.
- The dashboard hook stays a packager and loses selection branches.
- A new selection mode belongs in `queue.ts`, not in a hook or component.
- `queue.ts` may read grade-policy helpers (for goal arithmetic); keep that edge
  one-directional.

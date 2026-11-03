# 0010. Repeat practice earns half XP

- Status: Accepted
- Date: 2026-11-02

## Context

Repeat practice (daily mode after the daily goal is met) advanced the
schedule and counted in the review log, but awarded no XP. The learner
reported losing momentum after the goal because extra study felt
unrewarding. The glossary's "Repeat practice earns no XP" rule encoded
that.

## Decision

Repeat practice in daily mode now awards half the rating's XP (rounded):
Again 3, Good 5, Easy 8, instead of 5/10/15. Other modes are unchanged:
weak and learning still earn full XP (they are always repeatable), and
listening/scenario/shadowing keep their existing eligibility. The daily
goal remains a distinct-card count, so repeat grades still do not move
it.

## Consequences

- The glossary's Repeat practice entry now says half XP.
- `gradeIntent.ts` carries a per-mode `repeatXpMultiplier` (daily 0.5,
  others 0) rather than a new eligibility value, so the goal-state logic
  stays in one place.
- The goal-reached toast and the session summary continue to report XP;
  repeat grades no longer look worthless.
- Phase 5's retention read is unaffected: it keys off the review log and
  card state, not XP.

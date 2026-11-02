# 0002. A study session is a framework-free state machine

- Status: Accepted
- Date: 2026-11-02

## Context

Queue growth, card index, the grade lock, response-time capture, retry appends, intro
dismissal, completion and restart lived in a React hook. The hook exposed raw setters, the
view mirrored per-card panel state, and the only tests covered two trivial helpers. The
most safety-critical rule — release the grade lock only after the next card has painted —
was completed in an effect outside the machine.

## Decision

`lib/studySession.ts` owns the whole session behind a command interface: grade,
card shown/settle, restart, close. The clock, grade callback, audio stop and close callback
are injected. The machine owns the grade lock, phase, retry queue, results and per-card
production state. `study/useStudySession.ts` is an adapter: it subscribes, forwards keys,
supplies the clock and calls commands. It does not derive phase or release locks itself.

## Consequences

- The lock invariant is testable and lives with the state it protects.
- The adapter stays small; views stop mirroring session state.
- Restart and retry semantics have one owner.
- The machine must not import React; adapters must not re-derive phase.

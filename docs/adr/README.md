# Architecture decisions

Short records of decisions that future work should not re-litigate. Terms are defined in
[`GLOSSARY.md`](../../GLOSSARY.md); the reasoning behind the deepening comes from the two
architecture reviews of 2026-11-02 (PRs #70–#76).

| ADR                                                          | Decision                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| [0001](0001-grade-policy-owns-decision-and-write.md)         | Grade policy owns both the decision and the write                     |
| [0002](0002-study-session-is-a-state-machine.md)             | A study session is a framework-free state machine                     |
| [0003](0003-practice-modes-share-loop-and-verdict.md)        | Practice modes share one question loop, distractor picker and verdict |
| [0004](0004-dashboard-uses-one-dialog-request.md)            | The dashboard opens one dialog at a time through one request          |
| [0005](0005-audio-manifest-is-one-seam.md)                   | The audio manifest is parsed and cached once                          |
| [0006](0006-playback-state-belongs-to-the-player.md)         | Playback state belongs to the player; auto-play is one rule           |
| [0007](0007-card-selection-lives-in-the-queue.md)            | Card selection lives in the queue module                              |
| [0008](0008-dashboard-derivations-live-in-one-view-model.md) | Dashboard derivations live in one view model                          |
| [0009](0009-pure-policy-in-lib-hooks-are-adapters.md)        | Pure policy lives in lib; hooks are adapters; e2e is the UI net       |

## Adding one

Copy the shape: title, status, date, context (the friction), decision, consequences. Record
a decision when a future explorer would otherwise reasonably suggest the opposite. Ephemeral
reasons ("not worth it right now") do not need an ADR.

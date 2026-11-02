# 0006. Playback state belongs to the player; auto-play is one rule

- Status: Accepted
- Date: 2026-11-02

## Context

The player kept its audio element private and exposed only an unused boolean, so it could
not say which clip was playing. Browse kept three flags (one of them derivable from the
other two), Alphabet and Listening kept their own busy flags, and the 300 ms
auto-play-once rule existed in three components with different failure handling.

## Decision

`lib/audioPlayer.ts` publishes now-playing identity and playing state through a
subscribable store; `hooks/useAudioPlayback.ts` exposes it via `useSyncExternalStore`.
Views derive their highlight from that state instead of keeping local busy flags.
`hooks/useAutoPlayOnce.ts` is the one auto-play-once rule: play a clip once per identity
after the card paints, with an optional failure callback.

## Consequences

- Four local flags collapse into one source of truth.
- Autoplay failure has one path; a mode that can explain the failure passes `onFailure`.
- The 300 ms timer and no-await-before-play behaviour are deliberate mobile-Safari gesture
  semantics; do not replace them with an awaited manifest fetch.
- Playback transitions are testable through the player store with the existing `FakeAudio`
  double.

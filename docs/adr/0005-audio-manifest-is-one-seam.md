# 0005. The audio manifest is parsed and cached once

- Status: Accepted
- Date: 2026-11-02

## Context

`/audio/index.json` was fetched and narrowed in two places with different fidelity: the
player fetched it eagerly and tolerated missing shapes, while the offline download
re-fetched it twice and re-implemented the warm/cache-put rule (`?warm=1`, 200 plus audio
content type, never `index.html`). Alphabet filename aliases lived in the player while the
rest of the alphabet metadata lived in `alphabet.ts`. The cache name was shared by three
implementations through an eight-line constant module.

## Decision

`lib/audioIndex.ts` owns the manifest: one memoized fetch per page load, the manifest type
and narrowing, filename resolution (including alphabet aliases), and the warm/cache-put
policy. Playback and the offline download consume it. `lib/audioCache.ts` remains the
constant holder for `AUDIO_CACHE_NAME` because `vite.config.ts` imports it at build time.
Network and cache dependencies are injected so the module is testable in Node.

## Consequences

- One request serves playback and download; cache policy changes once.
- A skipped clip is reported as skipped, so download progress counts only stored clips.
- The player keeps its public `play*`/`stopAudio`/speaker interface and owns no manifest
  knowledge.
- The cache name must not change casually: it is the service worker's cache identity and is
  imported by the build config.

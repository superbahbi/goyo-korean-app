# Prototype: the audio seam, designed three ways

Throwaway. Not for main. Answers one question and is kept only as the primary source for the
decision recorded on issue #91.

## The question

`client/src/lib/audioIndex.ts` publishes 19 exports: a store factory, four module-level
singletons, and four resolvers that each require an `AudioManifest` argument. Callers thread the
manifest around by hand — `audioPlayer.ts` repeats peek-then-resolve-then-warm three times, and
`DownloadAllAudio.tsx` composes the plan, the count and the warming itself.

What interface should the module present so a caller never sees the Audio manifest?

## Constraints any design had to satisfy

- Playback by domain id: vocabulary (card + voice), sentence (id + voice, cross-voice fallback),
  alphabet (character + consonant/vowel + voice, alias maps applied).
- Availability: sentence ids with a clip in any enabled voice, used to hide the play button.
- Offline: the vocabulary download list (deduped across enabled voices), warm one clip, forget one
  clip, and a per-clip result a batch can report failure on.
- One fetch per page load, prefetch at startup, retry after failure.
- A missing clip is not an error; a failed network or cache operation is.
- Only a 200 with an `audio/*` content type is stored, under the real URL — never `?warm=1`.
- DOM-free; `fetch` and the Cache API injected for tests.
- Behaviour unchanged.

---

## Design A — minimise the interface

```ts
export type AudioClipTarget =
  | { kind: "vocabulary"; id: string; voice: AudioVoice }
  | { kind: "sentence"; id: string; voice: AudioVoice }
  | { kind: "alphabet"; id: string; type: "consonant" | "vowel"; voice: AudioVoice };

export interface AudioIndex {
  resolve(target: AudioClipTarget, onClip: (clip: AudioClip) => void | Promise<void>): Promise<boolean>;
  availableSentenceIds(): Promise<ReadonlySet<string>>;
  offlineClipCount(): Promise<number>;
  warmAll(options?: { signal?: AbortSignal }): AsyncIterable<AudioWarmProgress>;
  readonly cache: { warm(url: string): Promise<boolean>; forget(url: string): Promise<void> };
}

export function createAudioIndex(dependencies?: AudioIndexDependencies): AudioIndex;
export const audioIndex: AudioIndex;
```

Key invariant: when the manifest is already loaded, `onClip` runs **before `resolve` returns**, in
the caller's task — the mobile-Safari gesture guarantee, written once instead of re-derived at three
call sites. `warmAll` owns the plan, dedupe, concurrency, abort, and "only stored clips count".

Thin: `cache` is a second door to warming, used only by the audio element; `resolve` asks every
caller to write `clip => player.play(clip.url, clip)`; the manifest stops being inspectable.

---

## Design B — maximise flexibility

Registry-driven voices and clip kinds, with the full capability menu retained.

```ts
export const AUDIO_VOICES: readonly AudioVoiceDefinition[];              // enabled, fallbackVoice
export const AUDIO_CLIP_KINDS: Record<AudioClipKind, AudioClipKindDefinition>;

export interface AudioIndexStore {
  peek(): AudioManifest | null;
  get(): Promise<AudioManifest>;
  prefetch(): void;
  subscribe(listener: (manifest: AudioManifest | null) => void): () => void;
  resolve(request: AudioClipRequest, options?: ResolveOptions): ClipResolution;      // "ready" | "missing" | "unloaded"
  resolveOrLoad(request: AudioClipRequest, options?: ResolveOptions): Promise<AudioClip | null>;
  describe(request: AudioClipRequest, manifest: AudioManifest, options?: ResolveOptions): ClipResolution;
  availability(kind: AudioClipKind, options?): Promise<AudioAvailability>;
  planDownload(options?): Promise<AudioDownloadPlan>;
  canWarm(): boolean;
  warm(target: string | AudioClip): Promise<boolean>;
  warmMany(targets, options?: WarmManyOptions): Promise<WarmReport>;
  forget(target: string | AudioClip): Promise<void>;
  forgetMany(targets): Promise<void>;
}
```

Plus `createFetchManifestSource`, `createMemoryAudioCache`, `createCacheApiStorage`, and the old
exported resolvers kept as delegates.

Thin: a capability menu, not a deep module. Every old resolver stays exported, so callers still
choose between `resolve` and `resolveOrLoad`; the `unloaded` status pushes a three-branch dance back
onto call sites; four injected seams each have exactly one adapter.

---

## Design C — common caller first

```ts
export interface AudioIndex {
  play(request: AudioClipRequest, voice: AudioVoice, start: AudioClipStart): Promise<boolean>;
  sentenceIdsWithClips(): Promise<ReadonlySet<string>>;
  downloadPlan(): Promise<string[]>;
  warm(url: string): Promise<boolean>;
  forget(url: string): Promise<void>;
}
```

`play` resolves the id, applies the voice rule or the alphabet alias, and starts the element in the
tap's task. One lossy boolean means "don't claim audio worked" — the only decision any caller makes.
`AudioManifest` and its parser move to `lib/audioManifest.ts`.

Thin: `false` conflates no-clip, blocked autoplay and decode failure; batching, cancel and progress
stay in `DownloadAllAudio.tsx`.

---

## Comparison

| | Depth | Locality | Seam placement |
| --- | --- | --- | --- |
| A | High — one call covers lookup + dispatch; two doors to warming | Gesture rule and batch policy both local | "Resolve this id and hand it over" |
| B | Low — capability menu behind a wide interface | Policy spread across registries; a new voice touches the parser too | Four seams, one adapter each |
| C | Highest — one call covers lookup + dispatch + start | Gesture rule local; batch policy not | "Play this id", where callers stand |

## Decision

**The hybrid: C's `play`, A's `warmAll` and count query, C's manifest move, A's `cache` dropped.**

```ts
play(request, voice, start)   // playback; gesture-safe; never rejects
sentenceIdsWithClips()        // availability
offlineClipCount()            // the pre-click label
warmAll({ signal })           // the batch, as an async iterable
warm(url) / forget(url)       // the audio element's primitives
```

Two runtime exports: `createAudioIndex` and `audioIndex`. Every member answers a different question;
none is a pass-through. `AudioManifest` leaves the public surface for `lib/audioManifest.ts`.

Why not C alone: the download half of A is real composition that belongs behind the seam, and
pushing it back into the component is how the manifest threading started. Why not A alone: its
`resolve` asks each caller to write the dispatch, and stops one level short of what callers want.
Why not B: it preserves every capability at the cost of depth, and its extra seams have one adapter
each.

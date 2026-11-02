import type { AudioVoice } from "./audioIndex";
import {
  forgetAudioClip,
  getAudioIndex,
  peekAudioIndex,
  resolveAlphabetClip,
  resolveSentenceClip,
  resolveVocabularyClip,
  resetAudioIndex as resetAudioManifest,
  sentenceIdsWithClips,
  warmAudioClip,
} from "./audioIndex";
/**
 * Plays pre-generated Korean audio from /public/audio.
 *
 * The app's domain IDs (for example, surv_001 and cons_001) are intentionally
 * mapped to the generated filename keys so UI components never need to know
 * how audio files are named. The manifest, filename resolution, and offline
 * cache policy live in `audioIndex.ts`; this module owns the audio element.
 */

let currentAudio: HTMLAudioElement | null = null;
// Settles the in-flight playback promise when it is stopped from outside, so
// callers awaiting playAudioFile never hang.
let settleStoppedPlayback: (() => void) | null = null;
export type AudioSpeaker = AudioVoice;
let selectedSpeaker: AudioSpeaker = "elevenlabs";

/** The kind of audio a clip belongs to, so views can highlight the right row. */
export type AudioClipKind = "vocabulary" | "sentence" | "alphabet";

export interface AudioClipRef {
  kind: AudioClipKind;
  /** The domain id the clip was requested for. */
  id: string;
}

export interface AudioPlaybackState {
  /** The clip currently playing, or null when nothing is. */
  clip: AudioClipRef | null;
  playing: boolean;
}

const STOPPED: AudioPlaybackState = { clip: null, playing: false };
let playback: AudioPlaybackState = STOPPED;
const playbackListeners = new Set<() => void>();

function sameClip(a: AudioClipRef | null, b: AudioClipRef | null): boolean {
  return a?.kind === b?.kind && a?.id === b?.id;
}

/** Publish one immutable snapshot; listeners only see real transitions. */
function publishPlayback(next: AudioPlaybackState): void {
  if (playback.playing === next.playing && sameClip(playback.clip, next.clip)) {
    return;
  }
  playback = next;
  playbackListeners.forEach(listener => listener());
}

/** The player's current clip and whether it is actually playing. */
export function getAudioPlayback(): AudioPlaybackState {
  return playback;
}

/** Subscribe to now-playing transitions; returns an unsubscribe function. */
export function subscribeAudioPlayback(listener: () => void): () => void {
  playbackListeners.add(listener);
  return () => {
    playbackListeners.delete(listener);
  };
}

/**
 * Rejection used when playback ends because a caller stopped it or replaced it
 * with a newer clip. It is not a failure: the UI must not offer a fallback or
 * log an error for it.
 */
export class PlaybackStoppedError extends Error {
  constructor() {
    super("Audio playback was stopped");
    this.name = "PlaybackStoppedError";
  }
}

/**
 * Resolves true when the clip played to the end or was intentionally stopped,
 * false when it could not start or failed midway. Callers that can show a
 * fallback (the study card) use the result; callers that treat audio as
 * optional may ignore it.
 */
export async function playVocabularyAudio(wordId: string): Promise<boolean> {
  try {
    // When the manifest is already loaded, resolve and trigger playback
    // synchronously without awaiting first, so mobile Safari retains user
    // gesture activation.
    const loaded = peekAudioIndex();
    if (loaded) {
      const audioFile = resolveVocabularyClip(loaded, wordId, selectedSpeaker);
      if (!audioFile) {
        throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
      }
      await playAudioFile(`/audio/${audioFile}`, {
        kind: "vocabulary",
        id: wordId,
      });
      return true;
    }

    const index = await getAudioIndex();
    const audioFile = resolveVocabularyClip(index, wordId, selectedSpeaker);
    if (!audioFile) {
      throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
    }

    await playAudioFile(`/audio/${audioFile}`, {
      kind: "vocabulary",
      id: wordId,
    });
    return true;
  } catch (error) {
    // Stopping a clip (closing a session, moving to the next card) is expected,
    // not a playback failure, so do not log it or show the fallback toast.
    if (error instanceof PlaybackStoppedError) return true;
    console.error("Vocabulary audio failed:", error);
    return false;
  }
}

export async function playAlphabetAudio(
  characterId: string,
  type: "consonant" | "vowel"
): Promise<void> {
  try {
    // Synchronous resolution when the manifest is cached preserves the gesture.
    const loaded = peekAudioIndex();
    if (loaded) {
      const audioFile = resolveAlphabetClip(
        loaded,
        characterId,
        type,
        selectedSpeaker
      );
      if (!audioFile) {
        throw new Error(`No generated audio mapped for ${type} ${characterId}`);
      }
      await playAudioFile(`/audio/${audioFile}`, {
        kind: "alphabet",
        id: characterId,
      });
      return;
    }

    const index = await getAudioIndex();
    const audioFile = resolveAlphabetClip(
      index,
      characterId,
      type,
      selectedSpeaker
    );
    if (!audioFile) {
      throw new Error(`No generated audio mapped for ${type} ${characterId}`);
    }

    await playAudioFile(`/audio/${audioFile}`, {
      kind: "alphabet",
      id: characterId,
    });
  } catch (error) {
    if (error instanceof PlaybackStoppedError) return;
    console.error("Alphabet audio failed:", error);
  }
}

/**
 * Plays the example sentence for a card or grammar example. Returns false when
 * the clip is missing or cannot start, so a caller that offers the button can
 * explain why nothing happened.
 */
export async function playSentenceAudio(sentenceId: string): Promise<boolean> {
  try {
    const index = peekAudioIndex() ?? (await getAudioIndex());
    const audioFile = resolveSentenceClip(index, sentenceId, selectedSpeaker);
    if (!audioFile) {
      throw new Error(`No sentence audio mapped for ${sentenceId}`);
    }
    await playAudioFile(`/audio/${audioFile}`, {
      kind: "sentence",
      id: sentenceId,
    });
    return true;
  } catch (error) {
    if (error instanceof PlaybackStoppedError) return true;
    console.error("Sentence audio failed:", error);
    return false;
  }
}

/**
 * Sentence ids that have a clip in at least one voice. UI uses this to show the
 * sentence player only where audio exists, since the library is generated in
 * batches and older users may have a stale offline index.
 */
export async function getAvailableSentenceIds(): Promise<Set<string>> {
  try {
    return sentenceIdsWithClips(await getAudioIndex());
  } catch {
    return new Set();
  }
}

function warmAudioCache(audioPath: string): void {
  // Playback warming is best effort: a failed prefetch must not affect the
  // element. Batch download awaits the same policy and reports failures.
  void warmAudioClip(audioPath).catch(() => {});
}

function playAudioFile(audioPath: string, clip: AudioClipRef): Promise<void> {
  return new Promise((resolve, reject) => {
    stopAudio();
    warmAudioCache(audioPath);

    const audio = new Audio();
    currentAudio = audio;
    publishPlayback({ clip, playing: true });
    audio.preload = "auto";
    audio.playbackRate = 0.9;
    audio.volume = 1;
    let retried = false;
    // Set once stopAudio (or a newer clip) takes over, so late events cannot
    // resurrect the playback or evict the cache.
    let stopped = false;
    let settled = false;
    // Each attach gets an id so a superseded attempt's late errors are ignored.
    let attemptId = 0;

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.onabort = null;
      if (currentAudio === audio) currentAudio = null;
      if (settleStoppedPlayback === handleStopped) settleStoppedPlayback = null;
    };

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      // A stopped clip already published its transition; only the element that
      // still owns the player may clear it.
      const owned = currentAudio === audio;
      cleanup();
      if (owned) publishPlayback(STOPPED);
      if (error) reject(error);
      else resolve();
    };

    const handleStopped = () => {
      stopped = true;
      finish(new PlaybackStoppedError());
    };

    settleStoppedPlayback = handleStopped;

    // A cached response can be stale or corrupt (for example HTML saved from a
    // fallback route). Drop it and retry once from the network, bypassing the
    // service worker by adding a query string to the URL. Only real media
    // errors reach this path; a rejected play() must not discard a good clip.
    const recover = async (id: number, message: string) => {
      if (id !== attemptId || stopped) return;
      // Delete first: the retry must not race the service worker and re-read the bad entry.
      await forgetAudioClip(audioPath);
      if (id !== attemptId || stopped) return;
      if (retried) {
        finish(new Error(message));
        return;
      }
      retried = true;
      // Repopulate the cache with the real clip once the poisoned entry is gone.
      warmAudioCache(audioPath);
      attach(`${audioPath}?retry=1`);
    };

    const attach = (src: string) => {
      const id = ++attemptId;
      audio.onended = () => {
        if (id !== attemptId) return;
        finish();
      };
      audio.onerror = () => {
        if (id !== attemptId) return;
        void recover(id, audio.error?.message || `Unable to load ${audioPath}`);
      };
      audio.onabort = () => {
        if (id !== attemptId) return;
        finish(new PlaybackStoppedError());
      };
      audio.src = src;
      audio.play().catch(error => {
        if (id !== attemptId) return;
        const name = error instanceof Error ? error.name : "";
        // stopAudio already settled the promise and paused the element; the
        // browser's abort rejection is expected and must not evict the clip.
        if (name === "AbortError" && stopped) return;
        // Autoplay blocking (iOS) and other start failures leave the cached
        // clip intact: the user can retry by tapping the speaker.
        finish(error instanceof Error ? error : new Error(String(error)));
      });
    };

    attach(audioPath);
  });
}

export function stopAudio(): void {
  const audio = currentAudio;
  const settle = settleStoppedPlayback;
  // Clear the module state before pausing so re-entry and late play() events
  // are no-ops, then tear the element down before settling the pending promise.
  currentAudio = null;
  settleStoppedPlayback = null;

  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.onabort = null;
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
  }

  settle?.();
  publishPlayback(STOPPED);
}

export function isAudioPlaying(): boolean {
  return Boolean(currentAudio && !currentAudio.paused);
}

export function resetAudioIndex(): void {
  resetAudioManifest();
}

export function setAudioSpeaker(speaker: AudioSpeaker): void {
  selectedSpeaker = speaker;
  stopAudio();
}

export function getAudioSpeaker(): AudioSpeaker {
  return selectedSpeaker;
}

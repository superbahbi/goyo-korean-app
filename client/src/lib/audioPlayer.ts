import { AUDIO_CACHE_NAME } from "./audioCache";
/**
 * Plays pre-generated Korean audio from /public/audio.
 *
 * The app's domain IDs (for example, surv_001 and cons_001) are intentionally
 * mapped to the generated filename keys so UI components never need to know
 * how audio files are named.
 */

interface AudioIndex {
  vocabulary: Record<string, string>;
  female?: {
    vocabulary: Record<string, string>;
    alphabet: {
      consonants: Record<string, string>;
      vowels: Record<string, string>;
    };
  };
  alphabet: {
    consonants: Record<string, string>;
    vowels: Record<string, string>;
  };
}

let audioIndex: AudioIndex | null = null;
let audioIndexPromise: Promise<AudioIndex> | null = null;
let currentAudio: HTMLAudioElement | null = null;
// Settles the in-flight playback promise when it is stopped from outside, so
// callers awaiting playAudioFile never hang.
let settleStoppedPlayback: (() => void) | null = null;
export type AudioSpeaker = "elevenlabs" | "elevenlabs-female";
let selectedSpeaker: AudioSpeaker = "elevenlabs";

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

const consonantAudioAliases: Record<string, string> = {
  cons_001: "ga",
  cons_002: "na",
  cons_003: "da",
  cons_004: "ra",
  cons_005: "ma",
  cons_006: "ba",
  cons_007: "sa",
  cons_008: "a_consonant",
  cons_009: "ja",
  cons_010: "cha2",
  cons_011: "cha",
  cons_012: "kha",
  cons_013: "ta",
  cons_014: "pha",
  cons_015: "ha",
};

const vowelAudioAliases: Record<string, string> = {
  vowel_001: "a",
  vowel_002: "ya",
  vowel_003: "eo",
  vowel_004: "yeo",
  vowel_005: "o",
  vowel_006: "yo",
  vowel_007: "u",
  vowel_008: "yu",
  vowel_009: "eu",
  vowel_010: "i",
  vowel_011: "ae",
  vowel_012: "e",
};

function fetchAudioIndex(): Promise<AudioIndex> {
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return Promise.reject(
      new Error("Audio index fetch called outside browser")
    );
  }

  // No cache-busting query and no `no-store`: the service worker precaches this
  // exact URL, and a query string would miss that entry and fail offline. A
  // regenerated index gets a new precache revision on the next deploy.
  return fetch("/audio/index.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`Audio index request failed (${response.status})`);
      }
      return response.json() as Promise<AudioIndex>;
    })
    .then(data => {
      audioIndex = data;
      return data;
    });
}

// Module-level prefetch: begin loading immediately so the index is typically resolved by first tap
if (typeof window !== "undefined") {
  audioIndexPromise = fetchAudioIndex().catch(err => {
    audioIndexPromise = null;
    throw err;
  });
  audioIndexPromise.catch(() => {
    /* swallow background preload rejection to avoid unhandled rejection warning */
  });
}

async function loadAudioIndex(): Promise<AudioIndex> {
  if (audioIndex) return audioIndex;
  if (!audioIndexPromise) {
    audioIndexPromise = fetchAudioIndex().catch(err => {
      audioIndexPromise = null;
      throw err;
    });
  }
  return audioIndexPromise;
}

function resolveVocabularyAudioFile(
  index: AudioIndex,
  wordId: string
): string | undefined {
  const vocabularyIndex =
    selectedSpeaker === "elevenlabs-female"
      ? index.female?.vocabulary
      : index.vocabulary;
  // Filenames carry a content hash, so the index is the only way to resolve a
  // clip; there is no filename to guess when an entry is missing.
  return vocabularyIndex?.[wordId];
}

function resolveAlphabetAudioFile(
  index: AudioIndex,
  characterId: string,
  type: "consonant" | "vowel"
): string | undefined {
  const aliases =
    type === "consonant" ? consonantAudioAliases : vowelAudioAliases;
  const alphabetIndex =
    selectedSpeaker === "elevenlabs-female"
      ? index.female?.alphabet
      : index.alphabet;
  const files =
    type === "consonant" ? alphabetIndex?.consonants : alphabetIndex?.vowels;
  if (!files) throw new Error("Premium audio index is unavailable");
  // The male index keys alphabet clips by mnemonic, the female index by ID.
  // Try the ID first (both indexes include it), then the mnemonic alias.
  const alias = aliases[characterId];
  return files[characterId] ?? (alias ? files[alias] : undefined);
}

/**
 * Resolves true when the clip played to the end or was intentionally stopped,
 * false when it could not start or failed midway. Callers that can show a
 * fallback (the study card) use the result; callers that treat audio as
 * optional may ignore it.
 */
export async function playVocabularyAudio(wordId: string): Promise<boolean> {
  try {
    // When the index is already loaded, resolve and trigger playback synchronously
    // without awaiting first, so mobile Safari retains user gesture activation.
    if (audioIndex) {
      const audioFile = resolveVocabularyAudioFile(audioIndex, wordId);
      if (!audioFile) {
        throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
      }
      await playAudioFile(`/audio/${audioFile}`);
      return true;
    }

    const index = await loadAudioIndex();
    const audioFile = resolveVocabularyAudioFile(index, wordId);
    if (!audioFile) {
      throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
    }

    await playAudioFile(`/audio/${audioFile}`);
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
    // Synchronous resolution when index is cached to preserve user gesture
    if (audioIndex) {
      const audioFile = resolveAlphabetAudioFile(audioIndex, characterId, type);
      if (!audioFile) {
        throw new Error(`No generated audio mapped for ${type} ${characterId}`);
      }
      await playAudioFile(`/audio/${audioFile}`);
      return;
    }

    const index = await loadAudioIndex();
    const audioFile = resolveAlphabetAudioFile(index, characterId, type);
    if (!audioFile) {
      throw new Error(`No generated audio mapped for ${type} ${characterId}`);
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    if (error instanceof PlaybackStoppedError) return;
    console.error("Alphabet audio failed:", error);
  }
}

/**
 * Playback requests use range requests, which the service worker does not cache,
 * so warm the offline cache with a plain fetch the first time a clip plays.
 */
async function warmAudioCache(audioPath: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    if (await cache.match(audioPath)) return;
    // The ?warm=1 suffix keeps this out of the service worker's mp3 rule, so the
    // response is a complete 200 the Cache API can store under the real URL.
    const response = await fetch(`${audioPath}?warm=1`);
    // A missing clip falls back to index.html with a 200, which must never be
    // stored as audio or the service worker will serve it forever.
    if (
      response.status === 200 &&
      (response.headers.get("content-type") ?? "").startsWith("audio/")
    ) {
      await cache.put(audioPath, response);
    }
  } catch {
    /* offline caching is best effort */
  }
}

async function forgetCachedAudio(audioPath: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.delete(audioPath);
  } catch {
    /* best effort */
  }
}

function playAudioFile(audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopAudio();
    void warmAudioCache(audioPath);

    const audio = new Audio();
    currentAudio = audio;
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
      cleanup();
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
      await forgetCachedAudio(audioPath);
      if (id !== attemptId || stopped) return;
      if (retried) {
        finish(new Error(message));
        return;
      }
      retried = true;
      // Repopulate the cache with the real clip once the poisoned entry is gone.
      void warmAudioCache(audioPath);
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
}

export function isAudioPlaying(): boolean {
  return Boolean(currentAudio && !currentAudio.paused);
}

export function resetAudioIndex(): void {
  audioIndex = null;
  audioIndexPromise = null;
}

export function setAudioSpeaker(speaker: AudioSpeaker): void {
  selectedSpeaker = speaker;
  stopAudio();
}

export function getAudioSpeaker(): AudioSpeaker {
  return selectedSpeaker;
}

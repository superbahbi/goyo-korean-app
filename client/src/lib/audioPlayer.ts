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
let currentAudio: HTMLAudioElement | null = null;
// Settles the in-flight playback promise when it is stopped from outside, so
// callers awaiting playAudioFile never hang.
let settleStoppedPlayback: (() => void) | null = null;
export type AudioSpeaker = "elevenlabs" | "elevenlabs-female";
let selectedSpeaker: AudioSpeaker = "elevenlabs";

const vocabularyAudioAliases: Record<string, string> = {
  surv_001: "hello",
  surv_002: "thank_you",
  surv_003: "sorry",
  surv_004: "yes",
  surv_005: "no",
  surv_007: "help",
  surv_008: "bathroom",
  daily_001: "nice_to_meet",
  daily_002: "how_are_you",
  num_001: "one",
  num_002: "two",
  num_003: "three",
  num_004: "four",
  num_005: "five",
  food_001: "rice",
  food_002: "water",
  food_011: "soup",
  food_014: "meat",
};

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

async function loadAudioIndex(): Promise<AudioIndex> {
  if (audioIndex) return audioIndex;

  const response = await fetch(`/audio/index.json?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Audio index request failed (${response.status})`);
  }

  audioIndex = (await response.json()) as AudioIndex;
  return audioIndex;
}

export async function playVocabularyAudio(wordId: string, fallbackText?: string): Promise<void> {
  try {
    const index = await loadAudioIndex();
    const legacyKey = vocabularyAudioAliases[wordId];
    const vocabularyIndex = selectedSpeaker === "elevenlabs-female" ? index.female?.vocabulary : index.vocabulary;
    const audioFile = vocabularyIndex?.[wordId]
      ?? (legacyKey ? vocabularyIndex?.[legacyKey] : undefined)
      ?? (selectedSpeaker === "elevenlabs-female" ? `elevenlabs_female_${wordId}.mp3` : undefined);

    if (!audioFile) {
      throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Vocabulary audio failed:", error);
  }
}

export async function playAlphabetAudio(
  characterId: string,
  type: "consonant" | "vowel"
): Promise<void> {
  try {
    const index = await loadAudioIndex();
    const aliases = type === "consonant" ? consonantAudioAliases : vowelAudioAliases;
    const key = aliases[characterId] ?? characterId;
    const alphabetIndex = selectedSpeaker === "elevenlabs-female" ? index.female?.alphabet : index.alphabet;
    const files = type === "consonant" ? alphabetIndex?.consonants : alphabetIndex?.vowels;
    if (!files) throw new Error("Female premium audio index is unavailable");
    const audioFile = files[key]
      ?? (selectedSpeaker === "elevenlabs-female" ? `elevenlabs_female_${characterId}.mp3` : undefined);

    if (!audioFile) {
      throw new Error(`No generated audio mapped for ${type} ${characterId}`);
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
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
    if (response.status === 200 && (response.headers.get("content-type") ?? "").startsWith("audio/")) {
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
    // Each attach gets an id so a superseded attempt's late errors are ignored.
    let attemptId = 0;

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.onabort = null;
      if (currentAudio === audio) currentAudio = null;
      settleStoppedPlayback = null;
    };

    settleStoppedPlayback = () => {
      cleanup();
      reject(new Error("Audio playback was stopped"));
    };

    // A cached response can be stale or corrupt (for example HTML saved from a
    // fallback route). Drop it and retry once from the network, bypassing the
    // service worker by adding a query string to the URL.
    const recover = async (id: number, message: string) => {
      if (id !== attemptId) return;
      // Delete first: the retry must not race the service worker and re-read the bad entry.
      await forgetCachedAudio(audioPath);
      if (id !== attemptId) return;
      if (retried) {
        cleanup();
        reject(new Error(message));
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
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        void recover(id, audio.error?.message || `Unable to load ${audioPath}`);
      };
      audio.onabort = () => {
        if (id !== attemptId) return;
        cleanup();
        reject(new Error("Audio playback was stopped"));
      };
      audio.src = src;
      audio.play().catch((error) => {
        void recover(id, String(error));
      });
    };

    attach(audioPath);
  });
}

export function stopAudio(): void {
  settleStoppedPlayback?.();
  settleStoppedPlayback = null;

  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.onabort = null;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

}

export function isAudioPlaying(): boolean {
  return Boolean(currentAudio && !currentAudio.paused);
}

export function resetAudioIndex(): void {
  audioIndex = null;
}

export function setAudioSpeaker(speaker: AudioSpeaker): void {
  selectedSpeaker = speaker;
  stopAudio();
}

export function getAudioSpeaker(): AudioSpeaker {
  return selectedSpeaker;
}

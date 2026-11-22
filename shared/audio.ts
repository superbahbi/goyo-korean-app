/**
 * Cross-platform audio playback.
 *
 * The clip-to-id rules already live in `client/src/lib/audioIndex`; this module
 * adds the small amount of state every player needs (the loaded manifest, the
 * selected voice, which clip is playing, and subscribers) and delegates the
 * actual sound to a platform driver.
 *
 * Web passes an `HTMLAudioElement`/Web Audio driver, React Native passes an
 * `expo-av` driver. Both receive a fully resolved URL, so neither has to know
 * how the manifest names its content-hashed files.
 */

import {
  parseAudioManifest,
  resolveAlphabetClip,
  resolveSentenceClip,
  resolveVocabularyClip,
  sentenceIdsWithClips,
  type AudioManifest,
  type AudioVoice,
} from "../client/src/lib/audioIndex";

export type { AudioVoice } from "../client/src/lib/audioIndex";

/** The only thing a platform player has to implement. */
export interface PlatformAudioDriver {
  playUrl(url: string): Promise<void>;
  stop(): void;
}

export type PlayingClipKind = "vocabulary" | "alphabet" | "sentence";

export interface PlayingClip {
  kind: PlayingClipKind;
  id: string;
}

export interface CrossPlatformAudioOptions {
  /** Directory that holds `index.json` and the clip files. Default `/audio`. */
  baseUrl?: string;
  /** Injected by tests or a native asset loader; defaults to `fetch`. */
  fetchManifest?: () => Promise<unknown>;
  driver: PlatformAudioDriver;
}

export interface CrossPlatformAudioController {
  playVocabulary(wordId: string): Promise<boolean>;
  playAlphabet(
    characterId: string,
    type: "consonant" | "vowel"
  ): Promise<boolean>;
  playSentence(sentenceId: string): Promise<boolean>;
  getAvailableSentenceIds(): Promise<Set<string>>;
  setSpeaker(voice: AudioVoice): void;
  getSpeaker(): AudioVoice;
  stop(): void;
  getPlayingClip(): PlayingClip | null;
  subscribe(listener: () => void): () => void;
}

const DEFAULT_BASE_URL = "/audio";
const DEFAULT_VOICE: AudioVoice = "elevenlabs";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function isAbsoluteUrl(file: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(file) || file.startsWith("data:");
}

/** Join a manifest filename to the configured audio root. */
function clipUrl(baseUrl: string, file: string): string {
  if (isAbsoluteUrl(file)) return file;
  return `${trimTrailingSlashes(baseUrl)}/${file.replace(/^\/+/, "")}`;
}

function browserFetch(): typeof fetch | null {
  return typeof globalThis.fetch === "function" ? globalThis.fetch : null;
}

async function defaultFetchManifest(baseUrl: string): Promise<unknown> {
  const fetchImpl = browserFetch();
  if (!fetchImpl) throw new Error("Audio manifest fetch is unavailable");

  const response = await fetchImpl(clipUrl(baseUrl, "index.json"));
  if (!response.ok) {
    throw new Error(`Audio manifest request failed (${response.status})`);
  }
  return response.json();
}

/**
 * One audio controller per platform, independent of the player underneath.
 *
 * Manifest loading is shared and retried after a failure, so a temporary
 * network error does not permanently break playback. A play call resolves
 * `true` when the clip exists and the driver accepted it, and `false` when the
 * clip is missing or the driver rejected it — never throwing at the call site.
 */
export function createCrossPlatformAudioController({
  baseUrl = DEFAULT_BASE_URL,
  fetchManifest,
  driver,
}: CrossPlatformAudioOptions): CrossPlatformAudioController {
  const root = trimTrailingSlashes(baseUrl) || DEFAULT_BASE_URL;

  let manifest: AudioManifest | null = null;
  let manifestRequest: Promise<AudioManifest> | null = null;
  let speaker: AudioVoice = DEFAULT_VOICE;
  let playingClip: PlayingClip | null = null;
  let playbackToken = 0;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of Array.from(listeners)) {
      try {
        listener();
      } catch {
        // Playback must continue even if a subscriber throws.
      }
    }
  };

  const getManifest = (): Promise<AudioManifest> => {
    if (manifest) return Promise.resolve(manifest);
    if (!manifestRequest) {
      const load = fetchManifest ? fetchManifest() : defaultFetchManifest(root);
      manifestRequest = Promise.resolve(load)
        .then(parseAudioManifest)
        .then(parsed => {
          manifest = parsed;
          return parsed;
        })
        .catch(error => {
          // A failed load is retryable on the next call.
          manifestRequest = null;
          throw error;
        });
    }
    return manifestRequest;
  };

  const availableManifest = async (): Promise<AudioManifest | null> => {
    try {
      return await getManifest();
    } catch {
      return null;
    }
  };

  const stopDriver = () => {
    try {
      driver.stop();
    } catch {
      // A platform player that fails to stop must not break the controller.
    }
  };

  const playFile = async (
    clip: PlayingClip,
    file: string
  ): Promise<boolean> => {
    const token = ++playbackToken;

    // Starting a new clip supersedes whatever the driver was playing.
    stopDriver();
    playingClip = clip;
    notify();

    try {
      await driver.playUrl(clipUrl(root, file));
    } catch {
      if (token === playbackToken) {
        playingClip = null;
        notify();
      }
      return false;
    }

    // A newer play or a stop took over while this clip was starting.
    return token === playbackToken;
  };

  const playVocabulary = async (wordId: string): Promise<boolean> => {
    const loaded = await availableManifest();
    if (!loaded) return false;
    const file = resolveVocabularyClip(loaded, wordId, speaker);
    if (!file) return false;
    return playFile({ kind: "vocabulary", id: wordId }, file);
  };

  const playAlphabet = async (
    characterId: string,
    type: "consonant" | "vowel"
  ): Promise<boolean> => {
    const loaded = await availableManifest();
    if (!loaded) return false;
    const file = resolveAlphabetClip(loaded, characterId, type, speaker);
    if (!file) return false;
    return playFile({ kind: "alphabet", id: characterId }, file);
  };

  const playSentence = async (sentenceId: string): Promise<boolean> => {
    const loaded = await availableManifest();
    if (!loaded) return false;
    const file = resolveSentenceClip(loaded, sentenceId, speaker);
    if (!file) return false;
    return playFile({ kind: "sentence", id: sentenceId }, file);
  };

  const getAvailableSentenceIds = async (): Promise<Set<string>> => {
    const loaded = await availableManifest();
    return loaded ? sentenceIdsWithClips(loaded) : new Set<string>();
  };

  const setSpeaker = (voice: AudioVoice) => {
    if (voice === speaker) return;
    speaker = voice;
    notify();
  };

  const stop = () => {
    playbackToken += 1;
    stopDriver();
    if (playingClip) {
      playingClip = null;
      notify();
    }
  };

  return {
    playVocabulary,
    playAlphabet,
    playSentence,
    getAvailableSentenceIds,
    setSpeaker,
    getSpeaker: () => speaker,
    stop,
    getPlayingClip: () => playingClip,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

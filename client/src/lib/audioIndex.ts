import {
  ALPHABET_CONSONANT_AUDIO_ALIASES,
  ALPHABET_VOWEL_AUDIO_ALIASES,
} from "./alphabet";
import { AUDIO_CACHE_NAME } from "./audioCache";

/**
 * Audio manifest: the map from domain IDs to content-hashed clip filenames,
 * plus the offline-cache policy for those clips.
 *
 * Playback and the "Download all audio" control both need the same answers —
 * which clip belongs to an ID, whether it is already cached, and which
 * responses are safe to store — so this module owns the one fetch and the one
 * cache-put rule. Callers see clip filenames, never the raw `/audio/index.json`
 * shape.
 */

export type AudioVoice = "elevenlabs" | "elevenlabs-female";

export interface AlphabetAudioIndex {
  consonants: Record<string, string>;
  vowels: Record<string, string>;
}

export interface AudioManifest {
  /** Vocabulary clips for the male narrator, keyed by card id. */
  vocabulary: Record<string, string>;
  /** Example-sentence clips, keyed by the card or grammar example id. */
  sentences: Record<string, string>;
  alphabet: AlphabetAudioIndex;
  female?: {
    vocabulary: Record<string, string>;
    sentences: Record<string, string>;
    alphabet: AlphabetAudioIndex;
  };
}

function stringRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) return {};
  const record: Record<string, string> = {};
  for (const [key, file] of Object.entries(value)) {
    if (typeof file === "string") record[key] = file;
  }
  return record;
}

function alphabetIndex(value: unknown): AlphabetAudioIndex {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return {
    consonants: stringRecord(record.consonants),
    vowels: stringRecord(record.vowels),
  };
}

/**
 * Narrows the raw manifest JSON to the shape the app relies on. Missing maps
 * become empty, so a partially generated library still plays what it has; a
 * value that is not an object at all is a broken index and rejects the load.
 */
export function parseAudioManifest(value: unknown): AudioManifest {
  if (typeof value !== "object" || value === null) {
    throw new Error("Audio index has an unexpected shape");
  }
  const record = value as Record<string, unknown>;
  const female =
    typeof record.female === "object" && record.female !== null
      ? (record.female as Record<string, unknown>)
      : null;

  return {
    vocabulary: stringRecord(record.vocabulary),
    sentences: stringRecord(record.sentences),
    alphabet: alphabetIndex(record.alphabet),
    ...(female
      ? {
          female: {
            vocabulary: stringRecord(female.vocabulary),
            sentences: stringRecord(female.sentences),
            alphabet: alphabetIndex(female.alphabet),
          },
        }
      : {}),
  };
}

/** Vocabulary filename for a card, or undefined when the clip is missing. */
export function resolveVocabularyClip(
  manifest: AudioManifest,
  wordId: string,
  voice: AudioVoice
): string | undefined {
  const vocabulary =
    voice === "elevenlabs-female"
      ? manifest.female?.vocabulary
      : manifest.vocabulary;
  // Filenames carry a content hash, so the manifest is the only way to resolve
  // a clip; there is no filename to guess when an entry is missing.
  return vocabulary?.[wordId];
}

/**
 * Sentence filename for a card, or undefined when no voice has the clip. A
 * missing clip in the chosen voice falls back to the other one rather than
 * failing the tap, because sentence clips can lag the word library.
 */
export function resolveSentenceClip(
  manifest: AudioManifest,
  sentenceId: string,
  voice: AudioVoice
): string | undefined {
  const preferred =
    voice === "elevenlabs-female"
      ? manifest.female?.sentences
      : manifest.sentences;
  const fallback =
    voice === "elevenlabs-female"
      ? manifest.sentences
      : manifest.female?.sentences;
  return preferred?.[sentenceId] ?? fallback?.[sentenceId];
}

/**
 * Alphabet filename for a character id, or undefined when the clip is missing.
 * The male index keys basic alphabet clips by mnemonic, so after trying the id
 * the resolver applies the consonant/vowel alias kept with the alphabet data.
 */
export function resolveAlphabetClip(
  manifest: AudioManifest,
  characterId: string,
  type: "consonant" | "vowel",
  voice: AudioVoice
): string | undefined {
  const alphabet =
    voice === "elevenlabs-female"
      ? manifest.female?.alphabet
      : manifest.alphabet;
  const files = type === "consonant" ? alphabet?.consonants : alphabet?.vowels;
  if (!files) return undefined;
  const aliases =
    type === "consonant"
      ? ALPHABET_CONSONANT_AUDIO_ALIASES
      : ALPHABET_VOWEL_AUDIO_ALIASES;
  const alias = aliases[characterId];
  return files[characterId] ?? (alias ? files[alias] : undefined);
}

/** Sentence ids that have a clip in at least one voice. */
export function sentenceIdsWithClips(manifest: AudioManifest): Set<string> {
  return new Set([
    ...Object.keys(manifest.sentences),
    ...Object.keys(manifest.female?.sentences ?? {}),
  ]);
}

/**
 * Every vocabulary clip URL the offline download should store, de-duplicated
 * across both voices and ordered as the manifest lists them.
 */
export function planAudioDownload(manifest: AudioManifest): string[] {
  const files = new Set<string>();
  for (const file of Object.values(manifest.vocabulary)) files.add(file);
  for (const file of Object.values(manifest.female?.vocabulary ?? {}))
    files.add(file);
  return Array.from(files, file => `/audio/${file}`);
}

/** The browser surface this module needs, injected so tests run in Node. */
export interface AudioCache {
  match(request: string): Promise<Response | undefined>;
  put(request: string, response: Response): Promise<void>;
  delete(request: string): Promise<boolean>;
}

export interface AudioCacheStorage {
  open(name: string): Promise<AudioCache>;
}

export type AudioFetch = (input: string) => Promise<Response>;

export interface AudioIndexDependencies {
  fetch?: AudioFetch;
  caches?: AudioCacheStorage;
}

export interface AudioIndexStore {
  /** The parsed manifest when it is already loaded; never starts a request. */
  peek(): AudioManifest | null;
  /** One shared request per store lifetime; retries after a failure. */
  get(): Promise<AudioManifest>;
  /** Start loading without waiting; a failure is left for the next get(). */
  prefetch(): void;
  /**
   * Store one clip under its real URL for offline playback. Resolves true when
   * the clip is stored or already cached, false when it was skipped (no Cache
   * API, no fetch, a non-200, or a non-audio response). Rejects when the
   * network, cache lookup, or cache put fails so a batch download can report
   * failure; playback callers swallow the rejection.
   */
  warm(audioPath: string): Promise<boolean>;
  /** Drop one clip from the offline cache. Always resolves. */
  forget(audioPath: string): Promise<void>;
}

function browserFetch(): AudioFetch | undefined {
  return typeof fetch === "function"
    ? input => globalThis.fetch(input)
    : undefined;
}

function browserCaches(): AudioCacheStorage | undefined {
  return typeof globalThis.caches === "undefined"
    ? undefined
    : globalThis.caches;
}

export function createAudioIndexStore(
  dependencies: AudioIndexDependencies = {}
): AudioIndexStore {
  let manifest: AudioManifest | null = null;
  let pending: Promise<AudioManifest> | null = null;

  const fetchIndex = (): Promise<AudioManifest> => {
    const fetchImpl = dependencies.fetch ?? browserFetch();
    if (!fetchImpl) {
      return Promise.reject(new Error("Audio index fetch is unavailable"));
    }

    // No cache-busting query and no `no-store`: the service worker precaches
    // this exact URL, and a query string would miss that entry and fail
    // offline. A regenerated index gets a new precache revision on deploy.
    return fetchImpl("/audio/index.json")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Audio index request failed (${response.status})`);
        }
        return response.json() as Promise<unknown>;
      })
      .then(parseAudioManifest)
      .then(parsed => {
        manifest = parsed;
        return parsed;
      });
  };

  const get = (): Promise<AudioManifest> => {
    if (manifest) return Promise.resolve(manifest);
    if (!pending) {
      pending = fetchIndex().catch(error => {
        pending = null;
        throw error;
      });
    }
    return pending;
  };

  const prefetch = () => {
    // Background preload failures must not surface as unhandled rejections.
    void get().catch(() => {});
  };

  const warm = async (audioPath: string): Promise<boolean> => {
    const cacheStorage = dependencies.caches ?? browserCaches();
    const fetchImpl = dependencies.fetch ?? browserFetch();
    if (!cacheStorage || !fetchImpl) return false;

    const cache = await cacheStorage.open(AUDIO_CACHE_NAME);
    if (await cache.match(audioPath)) return true;

    // The ?warm=1 suffix keeps this out of the service worker's mp3 rule, so
    // the response is a complete 200 the Cache API can store under the real
    // URL. A missing clip falls back to index.html with a 200, which must never
    // be stored as audio or the service worker will serve it forever.
    const response = await fetchImpl(`${audioPath}?warm=1`);
    const type = response.headers.get("content-type") ?? "";
    if (response.status === 200 && type.startsWith("audio/")) {
      await cache.put(audioPath, response);
      return true;
    }
    return false;
  };

  const forget = async (audioPath: string): Promise<void> => {
    const cacheStorage = dependencies.caches ?? browserCaches();
    if (!cacheStorage) return;
    try {
      const cache = await cacheStorage.open(AUDIO_CACHE_NAME);
      await cache.delete(audioPath);
    } catch {
      /* best effort */
    }
  };

  return { peek: () => manifest, get, prefetch, warm, forget };
}

const defaultStore = createAudioIndexStore();

// Begin loading immediately so the manifest is typically resolved by first tap.
// Only browsers prefetch; Node tests use createAudioIndexStore with fake deps.
if (typeof window !== "undefined") defaultStore.prefetch();

export function peekAudioIndex(): AudioManifest | null {
  return defaultStore.peek();
}

export function getAudioIndex(): Promise<AudioManifest> {
  return defaultStore.get();
}

export function warmAudioClip(audioPath: string): Promise<boolean> {
  return defaultStore.warm(audioPath);
}

export function forgetAudioClip(audioPath: string): Promise<void> {
  return defaultStore.forget(audioPath);
}

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAudioIndexStore,
  parseAudioManifest,
  planAudioDownload,
  resolveAlphabetClip,
  resolveSentenceClip,
  resolveVocabularyClip,
  sentenceIdsWithClips,
  type AudioCacheStorage,
} from "./audioIndex";

/**
 * The manifest seam is shared by playback and the offline download, so these
 * tests drive it through its interface with fake fetch/cache dependencies: one
 * request per store, one narrowing rule, one alias resolver, one cache-put
 * policy.
 */

const manifestPayload = {
  vocabulary: { surv_001: "male_surv_001.mp3" },
  sentences: { surv_001: "male_sent_surv_001.mp3" },
  alphabet: {
    consonants: { ga: "male_cons_ga.mp3" },
    vowels: { a: "male_vowel_a.mp3" },
  },
  female: {
    vocabulary: { surv_001: "female_surv_001.mp3" },
    sentences: { surv_002: "female_sent_surv_002.mp3" },
    alphabet: {
      consonants: { cons_001: "female_cons_001.mp3" },
      vowels: { vowel_001: "female_vowel_001.mp3" },
    },
  },
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function audioResponse(contentType = "audio/mpeg", status = 200) {
  return new Response(new Uint8Array([1, 2, 3]), {
    status,
    headers: { "content-type": contentType },
  });
}

function memoryCaches() {
  const entries = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (key: string) => entries.get(key)),
    put: vi.fn(async (key: string, response: Response) => {
      entries.set(key, response);
    }),
    delete: vi.fn(async (key: string) => entries.delete(key)),
  };
  const storage: AudioCacheStorage = {
    open: vi.fn(async () => cache),
  };
  return { storage, cache, entries };
}

describe("parseAudioManifest", () => {
  it("narrows the raw JSON to string maps and fills missing sections", () => {
    const parsed = parseAudioManifest({
      vocabulary: { surv_001: "clip.mp3", broken: 42 },
      alphabet: { consonants: { ga: "ga.mp3" } },
    });

    expect(parsed.vocabulary).toEqual({ surv_001: "clip.mp3" });
    expect(parsed.sentences).toEqual({});
    expect(parsed.alphabet).toEqual({
      consonants: { ga: "ga.mp3" },
      vowels: {},
    });
    expect(parsed.female).toBeUndefined();
  });

  it("narrows the female section independently", () => {
    const parsed = parseAudioManifest({
      vocabulary: {},
      female: {
        vocabulary: { surv_001: "female.mp3" },
        sentences: "not-a-map",
      },
    });

    expect(parsed.female).toEqual({
      vocabulary: { surv_001: "female.mp3" },
      sentences: {},
      alphabet: { consonants: {}, vowels: {} },
    });
  });

  it("rejects a manifest that is not an object", () => {
    expect(() => parseAudioManifest(null)).toThrow(/unexpected shape/);
    expect(() => parseAudioManifest("nope")).toThrow(/unexpected shape/);
  });
});

describe("audio index store", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches the manifest once and shares it between callers", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(manifestPayload));
    const store = createAudioIndexStore({ fetch: fetchImpl });

    const [first, second] = await Promise.all([store.get(), store.get()]);
    const third = await store.get();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("/audio/index.json");
    expect(first).toBe(second);
    expect(third).toBe(first);
    expect(store.peek()).toBe(first);
  });

  it("retries after a failed load instead of caching the rejection", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("no", { status: 404 }))
      .mockResolvedValueOnce(jsonResponse(manifestPayload));
    const store = createAudioIndexStore({ fetch: fetchImpl });

    await expect(store.get()).rejects.toThrow(/404/);
    expect(store.peek()).toBeNull();
    await expect(store.get()).resolves.toMatchObject({
      vocabulary: { surv_001: "male_surv_001.mp3" },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("prefetches without waiting, and get() joins that request", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(manifestPayload));
    const store = createAudioIndexStore({ fetch: fetchImpl });

    store.prefetch();
    await store.get();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects when no fetch implementation is available", async () => {
    vi.stubGlobal("fetch", undefined);
    const store = createAudioIndexStore();

    await expect(store.get()).rejects.toThrow(/unavailable/);
  });
});

describe("clip resolution", () => {
  const manifest = parseAudioManifest(manifestPayload);

  it("uses the selected voice's vocabulary clip", () => {
    expect(resolveVocabularyClip(manifest, "surv_001", "elevenlabs")).toBe(
      "male_surv_001.mp3"
    );
    expect(
      resolveVocabularyClip(manifest, "surv_001", "elevenlabs-female")
    ).toBe("female_surv_001.mp3");
    expect(resolveVocabularyClip(manifest, "missing", "elevenlabs")).toBe(
      undefined
    );
  });

  it("falls back to the other voice for a missing sentence clip", () => {
    expect(resolveSentenceClip(manifest, "surv_001", "elevenlabs-female")).toBe(
      "male_sent_surv_001.mp3"
    );
    expect(resolveSentenceClip(manifest, "surv_002", "elevenlabs")).toBe(
      "female_sent_surv_002.mp3"
    );
    expect(resolveSentenceClip(manifest, "missing", "elevenlabs")).toBe(
      undefined
    );
  });

  it("resolves consonant and vowel ids through their aliases", () => {
    // The male index keys basic characters by mnemonic, not by id.
    expect(
      resolveAlphabetClip(manifest, "cons_001", "consonant", "elevenlabs")
    ).toBe("male_cons_ga.mp3");
    expect(
      resolveAlphabetClip(manifest, "vowel_001", "vowel", "elevenlabs")
    ).toBe("male_vowel_a.mp3");
    expect(
      resolveAlphabetClip(
        manifest,
        "cons_001",
        "consonant",
        "elevenlabs-female"
      )
    ).toBe("female_cons_001.mp3");
    expect(
      resolveAlphabetClip(manifest, "vowel_001", "vowel", "elevenlabs-female")
    ).toBe("female_vowel_001.mp3");
  });

  it("returns undefined for an unknown character id", () => {
    expect(
      resolveAlphabetClip(manifest, "cons_999", "consonant", "elevenlabs")
    ).toBeUndefined();
    expect(
      resolveAlphabetClip(manifest, "vowel_999", "vowel", "elevenlabs")
    ).toBeUndefined();
  });

  it("reports sentence ids from either voice", () => {
    expect(sentenceIdsWithClips(manifest)).toEqual(
      new Set(["surv_001", "surv_002"])
    );
  });
});

describe("planAudioDownload", () => {
  it("lists vocabulary clips from both voices once, as full URLs", () => {
    const manifest = parseAudioManifest({
      vocabulary: {
        surv_001: "male_surv_001.mp3",
        surv_002: "shared.mp3",
      },
      female: {
        vocabulary: {
          surv_001: "female_surv_001.mp3",
          surv_003: "shared.mp3",
        },
      },
    });

    expect(planAudioDownload(manifest)).toEqual([
      "/audio/male_surv_001.mp3",
      "/audio/shared.mp3",
      "/audio/female_surv_001.mp3",
    ]);
  });
});

describe("warmAudioClip", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stores a 200 audio response under the real URL, fetching with ?warm=1", async () => {
    const { storage, cache, entries } = memoryCaches();
    const clip = audioResponse();
    const fetchImpl = vi.fn(async () => clip);
    const store = createAudioIndexStore({ fetch: fetchImpl, caches: storage });

    await expect(store.warm("/audio/clip.mp3")).resolves.toBe(true);

    expect(fetchImpl).toHaveBeenCalledWith("/audio/clip.mp3?warm=1");
    expect(cache.put).toHaveBeenCalledWith("/audio/clip.mp3", clip);
    expect(entries.get("/audio/clip.mp3")).toBe(clip);
  });

  it("does not fetch when the clip is already cached", async () => {
    const { storage, cache, entries } = memoryCaches();
    entries.set("/audio/clip.mp3", audioResponse());
    const fetchImpl = vi.fn(async () => audioResponse());
    const store = createAudioIndexStore({ fetch: fetchImpl, caches: storage });

    await expect(store.warm("/audio/clip.mp3")).resolves.toBe(true);

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("skips non-200 responses", async () => {
    const { storage, cache } = memoryCaches();
    const store = createAudioIndexStore({
      fetch: vi.fn(async () => audioResponse("audio/mpeg", 404)),
      caches: storage,
    });

    await expect(store.warm("/audio/clip.mp3")).resolves.toBe(false);

    expect(cache.put).not.toHaveBeenCalled();
  });

  it("never stores the index.html fallback as audio", async () => {
    const { storage, cache } = memoryCaches();
    const store = createAudioIndexStore({
      fetch: vi.fn(async () => audioResponse("text/html", 200)),
      caches: storage,
    });

    await expect(store.warm("/audio/missing.mp3")).resolves.toBe(false);

    expect(cache.put).not.toHaveBeenCalled();
  });

  it("resolves false without a request when the Cache API is unavailable", async () => {
    vi.stubGlobal("caches", undefined);
    const fetchImpl = vi.fn(async () => audioResponse());
    const store = createAudioIndexStore({ fetch: fetchImpl });

    await expect(store.warm("/audio/clip.mp3")).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("resolves false without a request when fetch is unavailable", async () => {
    vi.stubGlobal("fetch", undefined);
    const { storage, cache } = memoryCaches();
    const store = createAudioIndexStore({ caches: storage });

    await expect(store.warm("/audio/clip.mp3")).resolves.toBe(false);
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("rejects when the clip request fails so a batch download can report it", async () => {
    const { storage } = memoryCaches();
    const store = createAudioIndexStore({
      fetch: vi.fn(async () => {
        throw new Error("offline");
      }),
      caches: storage,
    });

    await expect(store.warm("/audio/clip.mp3")).rejects.toThrow(/offline/);
  });

  it("forgets a clip without throwing when deletion fails", async () => {
    const { storage, cache } = memoryCaches();
    cache.delete.mockRejectedValueOnce(new Error("disk"));
    const store = createAudioIndexStore({ caches: storage });

    await expect(store.forget("/audio/clip.mp3")).resolves.toBeUndefined();
  });
});

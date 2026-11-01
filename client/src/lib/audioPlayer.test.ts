import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The study card treats the audio-first front as unusable when a clip cannot
 * play, so `playVocabularyAudio` must report failure instead of only logging.
 * A blocked autoplay or an intentional stop is not a failure, and neither may
 * discard the offline copy of the clip.
 */

const indexPayload = {
  vocabulary: { surv_001: "male_surv_001.mp3" },
  sentences: { surv_001: "male_sent_surv_001.mp3" },
  female: {
    vocabulary: { surv_001: "female_surv_001.mp3" },
    sentences: { surv_001: "female_sent_surv_001.mp3" },
    alphabet: { consonants: {}, vowels: {} },
  },
  alphabet: { consonants: {}, vowels: {} },
};

type PlayBehavior = "end" | "blocked" | "media-error" | "pending";

let playBehavior: PlayBehavior = "end";

class FakeAudio {
  static instances: FakeAudio[] = [];
  static playedSources: string[] = [];

  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  paused = true;
  playbackRate = 1;
  volume = 1;
  preload = "";
  currentTime = 0;
  error: { message: string } | null = null;
  src = "";
  pauseCalls = 0;
  private rejectPendingPlay: ((error: Error) => void) | null = null;

  constructor() {
    FakeAudio.instances.push(this);
  }

  play() {
    FakeAudio.playedSources.push(this.src);
    this.paused = false;

    if (playBehavior === "blocked") {
      const error = new Error("Autoplay is blocked");
      error.name = "NotAllowedError";
      return Promise.reject(error);
    }

    if (playBehavior === "media-error") {
      this.error = { message: "Unable to decode audio" };
      setTimeout(() => this.onerror?.(), 0);
      return Promise.resolve();
    }

    if (playBehavior === "pending") {
      // A real element leaves play() pending until it starts or is aborted.
      return new Promise<void>((_resolve, reject) => {
        this.rejectPendingPlay = reject;
      });
    }

    // Resolve on the next task so the test mirrors a clip finishing.
    setTimeout(() => this.onended?.(), 0);
    return Promise.resolve();
  }

  pause() {
    this.pauseCalls += 1;
    this.paused = true;
    // Pausing a clip that has not started yet aborts play() on real elements.
    if (this.rejectPendingPlay) {
      const reject = this.rejectPendingPlay;
      this.rejectPendingPlay = null;
      const error = new Error("Playback aborted");
      error.name = "AbortError";
      reject(error);
    }
  }

  load() {}
  removeAttribute() {}
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function installFakeCaches() {
  const entries = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (key: string) => entries.get(key) ?? null),
    put: vi.fn(async (key: string, response: Response) => {
      entries.set(key, response);
    }),
    delete: vi.fn(async (key: string) => entries.delete(key)),
  };

  vi.stubGlobal("caches", {
    open: vi.fn(async () => cache),
    match: vi.fn(async () => undefined),
    keys: vi.fn(async () => []),
  });

  return cache;
}

describe("playSentenceAudio", () => {
  beforeEach(() => {
    vi.resetModules();
    playBehavior = "end";
    FakeAudio.instances = [];
    FakeAudio.playedSources = [];
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Audio", FakeAudio);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("plays the sentence clip for the selected voice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(indexPayload))
    );

    const { playSentenceAudio } = await import("./audioPlayer");

    await expect(playSentenceAudio("surv_001")).resolves.toBe(true);
    expect(FakeAudio.playedSources).toEqual(["/audio/male_sent_surv_001.mp3"]);
  });

  it("uses the female sentence clip after switching speakers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(indexPayload))
    );

    const { playSentenceAudio, setAudioSpeaker } = await import(
      "./audioPlayer"
    );
    setAudioSpeaker("elevenlabs-female");

    await expect(playSentenceAudio("surv_001")).resolves.toBe(true);
    expect(FakeAudio.playedSources).toEqual([
      "/audio/female_sent_surv_001.mp3",
    ]);
  });

  it("falls back to the other voice when the selected one lacks the clip", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...indexPayload,
          female: {
            ...indexPayload.female,
            sentences: {},
          },
        })
      )
    );

    const { playSentenceAudio, setAudioSpeaker } = await import(
      "./audioPlayer"
    );
    setAudioSpeaker("elevenlabs-female");

    await expect(playSentenceAudio("surv_001")).resolves.toBe(true);
    expect(FakeAudio.playedSources).toEqual(["/audio/male_sent_surv_001.mp3"]);
  });

  it("resolves false when no sentence clip exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ...indexPayload, sentences: {} }))
    );

    const { playSentenceAudio } = await import("./audioPlayer");

    await expect(playSentenceAudio("surv_002")).resolves.toBe(false);
  });

  it("reports ids that have a clip in either voice", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...indexPayload,
          female: {
            ...indexPayload.female,
            sentences: { surv_002: "female_sent_surv_002.mp3" },
          },
        })
      )
    );

    const { getAvailableSentenceIds } = await import("./audioPlayer");

    await expect(getAvailableSentenceIds()).resolves.toEqual(
      new Set(["surv_001", "surv_002"])
    );
  });
});

describe("playVocabularyAudio", () => {
  beforeEach(() => {
    vi.resetModules();
    playBehavior = "end";
    FakeAudio.instances = [];
    FakeAudio.playedSources = [];
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Audio", FakeAudio);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves true when the clip plays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(indexPayload))
    );

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(true);
  });

  it("resolves false instead of throwing when the index cannot load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 404 }))
    );

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(false);
  });

  it("resolves false when the index has no clip for the card", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ...indexPayload, vocabulary: {} }))
    );

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(false);
  });

  it("keeps the cached clip when autoplay is blocked", async () => {
    const cache = installFakeCaches();
    playBehavior = "blocked";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(indexPayload))
    );

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(false);
    expect(cache.delete).not.toHaveBeenCalled();
  });

  it("treats an intentional stop as success without evicting the clip", async () => {
    const cache = installFakeCaches();
    playBehavior = "pending";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(indexPayload))
    );

    const { playVocabularyAudio, stopAudio } = await import("./audioPlayer");

    const playback = playVocabularyAudio("surv_001");
    // Let the index resolve and the element start playing.
    await new Promise(resolve => setTimeout(resolve, 0));
    const audio = FakeAudio.instances.at(-1);
    expect(audio).toBeDefined();

    stopAudio();

    await expect(playback).resolves.toBe(true);
    expect(audio?.pauseCalls).toBe(1);
    expect(cache.delete).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("evicts a corrupt clip and retries once before failing", async () => {
    const cache = installFakeCaches();
    playBehavior = "media-error";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(indexPayload))
    );

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(false);

    expect(cache.delete).toHaveBeenCalledWith("/audio/male_surv_001.mp3");
    expect(FakeAudio.playedSources).toEqual([
      "/audio/male_surv_001.mp3",
      "/audio/male_surv_001.mp3?retry=1",
    ]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The study card treats the audio-first front as unusable when a clip cannot
 * play, so `playVocabularyAudio` must report failure instead of only logging.
 */

const indexPayload = {
  vocabulary: { surv_001: "male_surv_001.mp3" },
  alphabet: { consonants: {}, vowels: {} },
};

class FakeAudio {
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  paused = true;
  playbackRate = 1;
  volume = 1;
  preload = "";
  currentTime = 0;
  error = null;
  src = "";

  play() {
    this.paused = false;
    // Resolve on the next task so the test mirrors a clip finishing.
    setTimeout(() => this.onended?.(), 0);
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  load() {}
  removeAttribute() {}
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("playVocabularyAudio", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Audio", FakeAudio);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves true when the clip plays", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(indexPayload)));

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(true);
  });

  it("resolves false instead of throwing when the index cannot load", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 404 })));

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(false);
  });

  it("resolves false when the index has no clip for the card", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ...indexPayload, vocabulary: {} })));

    const { playVocabularyAudio } = await import("./audioPlayer");

    await expect(playVocabularyAudio("surv_001")).resolves.toBe(false);
  });
});

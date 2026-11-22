import { describe, expect, it, vi } from "vitest";
import { FEMALE_VOICE_ENABLED } from "../client/src/lib/voiceAvailability";
import {
  createCrossPlatformAudioController,
  type PlatformAudioDriver,
} from "./audio";

const manifestPayload = {
  vocabulary: {
    surv_001: "male_surv_001.mp3",
    surv_002: "male_surv_002.mp3",
  },
  sentences: {
    surv_001: "male_sent_surv_001.mp3",
    grammar_copula_1: "male_sent_grammar_copula_1.mp3",
  },
  alphabet: {
    consonants: { ga: "male_cons_ga.mp3" },
    vowels: { vowel_001: "male_vowel_001.mp3" },
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

function fakeDriver(play: (url: string) => Promise<void> = async () => {}): {
  driver: PlatformAudioDriver;
  urls: string[];
  stops: () => number;
} {
  const urls: string[] = [];
  let stops = 0;
  return {
    driver: {
      playUrl: async url => {
        urls.push(url);
        await play(url);
      },
      stop: () => {
        stops += 1;
      },
    },
    urls,
    stops: () => stops,
  };
}

function controllerWith(
  overrides: Partial<
    Parameters<typeof createCrossPlatformAudioController>[0]
  > = {}
) {
  const fake = fakeDriver();
  const fetchManifest = vi.fn(async () => manifestPayload);
  const controller = createCrossPlatformAudioController({
    baseUrl: "https://cdn.example.com/audio/",
    fetchManifest,
    driver: fake.driver,
    ...overrides,
  });
  return { controller, fake, fetchManifest };
}

describe("createCrossPlatformAudioController", () => {
  it("resolves a vocabulary clip and joins it to the base URL", async () => {
    const { controller, fake, fetchManifest } = controllerWith();

    await expect(controller.playVocabulary("surv_001")).resolves.toBe(true);

    expect(fetchManifest).toHaveBeenCalledTimes(1);
    expect(fake.urls).toEqual([
      "https://cdn.example.com/audio/male_surv_001.mp3",
    ]);
    expect(controller.getPlayingClip()).toEqual({
      kind: "vocabulary",
      id: "surv_001",
    });
  });

  it("returns false for a clip the manifest does not contain", async () => {
    const { controller, fake } = controllerWith();

    await expect(controller.playVocabulary("missing_card")).resolves.toBe(
      false
    );

    expect(fake.urls).toEqual([]);
    expect(controller.getPlayingClip()).toBeNull();
  });

  it("loads the manifest once for repeated playback", async () => {
    const { controller, fake, fetchManifest } = controllerWith();

    await controller.playVocabulary("surv_001");
    await controller.playVocabulary("surv_002");

    expect(fetchManifest).toHaveBeenCalledTimes(1);
    expect(fake.urls).toHaveLength(2);
  });

  it("resolves alphabet ids through the manifest's mnemonic aliases", async () => {
    const { controller, fake } = controllerWith();

    await expect(
      controller.playAlphabet("cons_001", "consonant")
    ).resolves.toBe(true);
    await expect(controller.playAlphabet("vowel_001", "vowel")).resolves.toBe(
      true
    );

    expect(fake.urls).toEqual([
      "https://cdn.example.com/audio/male_cons_ga.mp3",
      "https://cdn.example.com/audio/male_vowel_001.mp3",
    ]);
    expect(controller.getPlayingClip()).toEqual({
      kind: "alphabet",
      id: "vowel_001",
    });
  });

  it("falls back to the other voice's sentence clip", async () => {
    const { controller, fake } = controllerWith();
    await controller.getAvailableSentenceIds();

    controller.setSpeaker("elevenlabs-female");

    // The female sentence index has surv_002, not surv_001.
    await expect(controller.playSentence("surv_001")).resolves.toBe(true);

    expect(fake.urls).toEqual([
      "https://cdn.example.com/audio/male_sent_surv_001.mp3",
    ]);
  });

  it("uses the selected speaker for vocabulary and alphabet clips", async () => {
    const { controller, fake } = controllerWith();
    await controller.getAvailableSentenceIds();

    controller.setSpeaker("elevenlabs-female");

    await expect(controller.playVocabulary("surv_001")).resolves.toBe(true);
    await expect(
      controller.playAlphabet("cons_001", "consonant")
    ).resolves.toBe(true);

    expect(fake.urls).toEqual([
      "https://cdn.example.com/audio/female_surv_001.mp3",
      "https://cdn.example.com/audio/female_cons_001.mp3",
    ]);
  });

  it("reports sentence ids that have a clip in an enabled voice", async () => {
    const { controller } = controllerWith();

    const ids = await controller.getAvailableSentenceIds();

    expect(ids).toEqual(
      new Set(
        FEMALE_VOICE_ENABLED
          ? ["surv_001", "grammar_copula_1", "surv_002"]
          : ["surv_001", "grammar_copula_1"]
      )
    );
  });

  it("switches speakers and notifies subscribers only on a change", async () => {
    const { controller } = controllerWith();
    const listener = vi.fn();
    controller.subscribe(listener);

    expect(controller.getSpeaker()).toBe("elevenlabs");

    controller.setSpeaker("elevenlabs");
    expect(listener).not.toHaveBeenCalled();

    controller.setSpeaker("elevenlabs-female");
    expect(controller.getSpeaker()).toBe("elevenlabs-female");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops the driver and clears the playing clip", async () => {
    const { controller, fake } = controllerWith();
    await controller.playVocabulary("surv_001");
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.stop();

    expect(fake.stops()).toBeGreaterThanOrEqual(2);
    expect(controller.getPlayingClip()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies on playback and stops after unsubscribe", async () => {
    const { controller } = controllerWith();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    await controller.playVocabulary("surv_001");
    expect(listener).toHaveBeenCalled();

    const before = listener.mock.calls.length;
    unsubscribe();
    await controller.playVocabulary("surv_002");

    expect(listener).toHaveBeenCalledTimes(before);
  });

  it("clears playback when the driver rejects the clip", async () => {
    const { controller } = controllerWith({
      driver: fakeDriver(async () => {
        throw new Error("decoder failed");
      }).driver,
    });

    await expect(controller.playVocabulary("surv_001")).resolves.toBe(false);

    expect(controller.getPlayingClip()).toBeNull();
  });

  it("returns false and retries after a manifest failure", async () => {
    const fetchManifest = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(manifestPayload);
    const fake = fakeDriver();
    const controller = createCrossPlatformAudioController({
      fetchManifest,
      driver: fake.driver,
    });

    await expect(controller.playVocabulary("surv_001")).resolves.toBe(false);
    await expect(controller.getAvailableSentenceIds()).resolves.toEqual(
      new Set(
        FEMALE_VOICE_ENABLED
          ? ["surv_001", "grammar_copula_1", "surv_002"]
          : ["surv_001", "grammar_copula_1"]
      )
    );

    expect(fetchManifest).toHaveBeenCalledTimes(2);
    await expect(controller.playVocabulary("surv_001")).resolves.toBe(true);
  });

  it("leaves absolute manifest filenames untouched", async () => {
    const fetchManifest = async () => ({
      vocabulary: { external: "https://assets.example.com/external.mp3" },
    });
    const fake = fakeDriver();
    const controller = createCrossPlatformAudioController({
      baseUrl: "/audio",
      fetchManifest,
      driver: fake.driver,
    });

    await controller.playVocabulary("external");

    expect(fake.urls).toEqual(["https://assets.example.com/external.mp3"]);
  });

  it("defaults to the /audio root", async () => {
    const fetchManifest = vi.fn(async () => ({
      vocabulary: { surv_001: "male_surv_001.mp3" },
    }));
    const fake = fakeDriver();
    const controller = createCrossPlatformAudioController({
      fetchManifest,
      driver: fake.driver,
    });

    await controller.playVocabulary("surv_001");

    expect(fake.urls).toEqual(["/audio/male_surv_001.mp3"]);
  });
});

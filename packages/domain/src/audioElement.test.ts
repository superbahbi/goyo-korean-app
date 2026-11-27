import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PlaybackStoppedError,
  createAudioElementPlayer,
  type AudioElementEnvironment,
} from "./audioElement";

/**
 * Element lifecycle only: a hand-driven fake Audio, so a test decides exactly
 * when `ended` or `error` fires. audioPlayer.test.ts covers the manifest and
 * the playing-state transitions through the real player; this file covers the
 * late-event and ordering rules inside the element itself.
 */

class FakeAudio {
  static instances: FakeAudio[] = [];

  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  playbackRate = 1;
  volume = 1;
  preload = "";
  currentTime = 0;
  error: { message: string } | null = null;
  src = "";
  pauseCalls = 0;
  playedSources: string[] = [];

  constructor() {
    FakeAudio.instances.push(this);
  }

  play() {
    this.playedSources.push(this.src);
    return Promise.resolve();
  }

  pause() {
    this.pauseCalls += 1;
  }

  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }

  load() {}
}

const clipA = { kind: "vocabulary", id: "a" } as const;
const clipB = { kind: "vocabulary", id: "b" } as const;

let calls: string[];
let env: AudioElementEnvironment;
let forgetGate: Promise<void>;

/** Let queued promise callbacks run. */
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

beforeEach(() => {
  FakeAudio.instances = [];
  calls = [];
  forgetGate = Promise.resolve();
  vi.stubGlobal("Audio", FakeAudio);
  env = {
    warm: path => void calls.push(`warm ${path}`),
    forget: path => {
      calls.push(`forget ${path}`);
      return forgetGate;
    },
    onPlaying: clip => void calls.push(`playing ${clip.id}`),
    onStopped: () => void calls.push("stopped"),
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("replacing a clip while another is playing", () => {
  it("rejects the old clip as stopped, not as a failure", async () => {
    const player = createAudioElementPlayer(env);
    const first = player.play("a.mp3", clipA);
    const settled = first.catch(error => error);
    void player.play("b.mp3", clipB);

    expect(await settled).toBeInstanceOf(PlaybackStoppedError);
  });

  it("ignores a late ended from the old element: the new clip keeps playing", async () => {
    const player = createAudioElementPlayer(env);
    const first = player.play("a.mp3", clipA).catch(() => {});
    const [oldAudio] = FakeAudio.instances;
    const oldEnded = oldAudio.onended;
    let secondDone = false;
    const second = player.play("b.mp3", clipB).then(() => {
      secondDone = true;
    });
    await first;
    calls.length = 0;

    // A browser can still deliver an ended it had already queued.
    oldEnded?.();
    oldAudio.onended?.();
    await flush();

    expect(secondDone).toBe(false);
    expect(calls).toEqual([]);

    FakeAudio.instances[1].onended?.();
    await second;
    expect(secondDone).toBe(true);
    expect(calls).toEqual(["stopped"]);
  });

  it("ignores a late error from the old element: no cache eviction, no retry, no failure", async () => {
    const player = createAudioElementPlayer(env);
    const first = player.play("a.mp3", clipA).catch(() => {});
    const [oldAudio] = FakeAudio.instances;
    const oldError = oldAudio.onerror;
    let secondResult: "pending" | "resolved" | Error = "pending";
    const second = player.play("b.mp3", clipB).then(
      () => (secondResult = "resolved"),
      error => (secondResult = error)
    );
    await first;
    calls.length = 0;

    oldAudio.error = { message: "old element died" };
    oldError?.();
    await flush();

    expect(calls).not.toContain("forget a.mp3");
    expect(calls).toEqual([]);
    expect(oldAudio.playedSources).toEqual(["a.mp3"]);
    expect(secondResult).toBe("pending");

    FakeAudio.instances[1].onended?.();
    await second;
    expect(secondResult).toBe("resolved");
  });

  it("tears the old element down and reports the new clip, in order", async () => {
    const player = createAudioElementPlayer(env);
    void player.play("a.mp3", clipA).catch(() => {});
    const [oldAudio] = FakeAudio.instances;
    void player.play("b.mp3", clipB);

    expect(oldAudio.pauseCalls).toBe(1);
    expect(oldAudio.src).toBe("");
    expect(oldAudio.onended).toBeNull();
    expect(oldAudio.onerror).toBeNull();
    // play() always stops first, so even the first clip opens with an idle report.
    expect(calls).toEqual([
      "stopped",
      "warm a.mp3",
      "playing a",
      "stopped",
      "warm b.mp3",
      "playing b",
    ]);
  });

  it("settles a stopped clip once, and a second stop does not report again", async () => {
    const player = createAudioElementPlayer(env);
    const done = player.play("a.mp3", clipA).catch(error => error);
    player.stop();
    expect(await done).toBeInstanceOf(PlaybackStoppedError);
    calls.length = 0;

    player.stop();

    // stop() with nothing playing still reports the idle transition; it must
    // not touch a clip or throw.
    expect(calls).toEqual(["stopped"]);
  });
});

describe("recovering from a corrupt clip", () => {
  it("forgets the cached URL before the ?retry=1 attempt, then warms again", async () => {
    const player = createAudioElementPlayer(env);
    let release!: () => void;
    forgetGate = new Promise<void>(resolve => (release = resolve));
    const done = player.play("a.mp3", clipA);
    const [audio] = FakeAudio.instances;
    calls.length = 0;

    audio.error = { message: "bad bytes" };
    audio.onerror?.();
    await flush();

    // The retry must not start while the forget is still in flight.
    expect(calls).toEqual(["forget a.mp3"]);
    expect(audio.playedSources).toEqual(["a.mp3"]);

    release();
    await flush();

    expect(calls).toEqual(["forget a.mp3", "warm a.mp3"]);
    expect(audio.playedSources).toEqual(["a.mp3", "a.mp3?retry=1"]);

    audio.onended?.();
    await done;
  });

  it("fails with the media error message when the retry also errors, after a second forget", async () => {
    const player = createAudioElementPlayer(env);
    const done = player.play("a.mp3", clipA).catch(error => error);
    const [audio] = FakeAudio.instances;

    audio.error = { message: "still bad" };
    audio.onerror?.();
    await flush();
    audio.onerror?.();
    await flush();

    const error = await done;
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(PlaybackStoppedError);
    expect((error as Error).message).toBe("still bad");
    expect(calls.filter(c => c === "forget a.mp3")).toHaveLength(2);
    expect(audio.playedSources).toEqual(["a.mp3", "a.mp3?retry=1"]);
  });

  it("does not retry when the clip was stopped while the forget was in flight", async () => {
    const player = createAudioElementPlayer(env);
    let release!: () => void;
    forgetGate = new Promise<void>(resolve => (release = resolve));
    const done = player.play("a.mp3", clipA).catch(error => error);
    const [audio] = FakeAudio.instances;

    audio.error = { message: "bad bytes" };
    audio.onerror?.();
    await flush();
    player.stop();
    release();
    await flush();

    expect(await done).toBeInstanceOf(PlaybackStoppedError);
    expect(audio.playedSources).toEqual(["a.mp3"]);
  });
});

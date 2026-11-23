import type { AudioClipRef } from "./audioPlaybackState";

/**
 * The audio element machinery: starting one clip, stopping or replacing it,
 * and recovering once from a corrupt cached response. The manifest lookup and
 * the observable now-playing state are supplied by the caller, so this module
 * owns nothing but the element lifecycle.
 */

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

export interface AudioElementEnvironment {
  /** Best-effort fetch into the offline audio cache. */
  warm(audioPath: string): void;
  /** Drop a corrupt cached clip before retrying from the network. */
  forget(audioPath: string): Promise<void>;
  /** A clip started (or replaced) playback. */
  onPlaying(clip: AudioClipRef): void;
  /** Nothing is playing any more. */
  onStopped(): void;
}

export interface AudioElementPlayer {
  /** Resolves when the clip ends or is stopped; rejects when it cannot play. */
  play(audioPath: string, clip: AudioClipRef): Promise<void>;
  /** Stop the current clip and settle its pending promise. */
  stop(): void;
}

export function createAudioElementPlayer(
  env: AudioElementEnvironment
): AudioElementPlayer {
  let currentAudio: HTMLAudioElement | null = null;
  // Settles the in-flight playback promise when it is stopped from outside, so
  // callers awaiting play never hang.
  let settleStoppedPlayback: (() => void) | null = null;

  function stop(): void {
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
    env.onStopped();
  }

  function play(audioPath: string, clip: AudioClipRef): Promise<void> {
    return new Promise((resolve, reject) => {
      stop();
      env.warm(audioPath);

      const audio = new Audio();
      currentAudio = audio;
      env.onPlaying(clip);
      audio.preload = "auto";
      audio.playbackRate = 0.9;
      audio.volume = 1;
      let retried = false;
      // Set once stop (or a newer clip) takes over, so late events cannot
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
        if (settleStoppedPlayback === handleStopped) {
          settleStoppedPlayback = null;
        }
      };

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        // A stopped clip already reported its transition; only the element that
        // still owns the player may clear it.
        const owned = currentAudio === audio;
        cleanup();
        if (owned) env.onStopped();
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
        await env.forget(audioPath);
        if (id !== attemptId || stopped) return;
        if (retried) {
          finish(new Error(message));
          return;
        }
        retried = true;
        // Repopulate the cache with the real clip once the poisoned entry is gone.
        env.warm(audioPath);
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
          void recover(
            id,
            audio.error?.message || `Unable to load ${audioPath}`
          );
        };
        audio.onabort = () => {
          if (id !== attemptId) return;
          finish(new PlaybackStoppedError());
        };
        audio.src = src;
        audio.play().catch(error => {
          if (id !== attemptId) return;
          const name = error instanceof Error ? error.name : "";
          // stop() already settled the promise and paused the element; the
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

  return { play, stop };
}

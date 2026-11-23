/**
 * The observable now-playing state shared by the audio player and React.
 *
 * Keeping it free of the audio element means views subscribe to one immutable
 * snapshot and only see real transitions; the element reports through
 * `showPlayingClip` / `clearPlayingClip`.
 */

/** The kind of audio a clip belongs to, so views can highlight the right row. */
export type AudioClipKind = "vocabulary" | "sentence" | "alphabet";

export interface AudioClipRef {
  kind: AudioClipKind;
  /** The domain id the clip was requested for. */
  id: string;
}

export interface AudioPlaybackState {
  /** The clip currently playing, or null when nothing is. */
  clip: AudioClipRef | null;
  playing: boolean;
}

const STOPPED: AudioPlaybackState = { clip: null, playing: false };
let playback: AudioPlaybackState = STOPPED;
const playbackListeners = new Set<() => void>();

function sameClip(a: AudioClipRef | null, b: AudioClipRef | null): boolean {
  return a?.kind === b?.kind && a?.id === b?.id;
}

/** Publish one immutable snapshot; listeners only see real transitions. */
function publishPlayback(next: AudioPlaybackState): void {
  if (playback.playing === next.playing && sameClip(playback.clip, next.clip)) {
    return;
  }
  playback = next;
  playbackListeners.forEach(listener => listener());
}

/** The player's current clip and whether it is actually playing. */
export function getAudioPlayback(): AudioPlaybackState {
  return playback;
}

/** Subscribe to now-playing transitions; returns an unsubscribe function. */
export function subscribeAudioPlayback(listener: () => void): () => void {
  playbackListeners.add(listener);
  return () => {
    playbackListeners.delete(listener);
  };
}

export function showPlayingClip(clip: AudioClipRef): void {
  publishPlayback({ clip, playing: true });
}

export function clearPlayingClip(): void {
  publishPlayback(STOPPED);
}

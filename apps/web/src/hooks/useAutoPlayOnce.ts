import { useEffect, useRef } from "react";

interface UseAutoPlayOnceOptions {
  /** The clip to play, or null when there is nothing to play. */
  clipId: string | null;
  /** Respects the learner's auto-play setting. */
  enabled: boolean;
  /** Starts the clip; resolves false when it could not play. */
  play: (clipId: string) => Promise<boolean>;
  /** Called once when the clip fails, for a mode that can explain why. */
  onFailure?: () => void;
  delayMs?: number;
}

/**
 * The one auto-play-once rule: after the card has painted, play its clip once
 * per identity. The clip id is remembered before the request starts, so a
 * re-render or flipping back to the front never replays it.
 *
 * The timer is deliberate. It keeps the same mobile-Safari gesture semantics as
 * the three call sites it replaced; do not await the manifest before playing.
 */
export function useAutoPlayOnce({
  clipId,
  enabled,
  play,
  onFailure,
  delayMs = 300,
}: UseAutoPlayOnceOptions): void {
  const playedId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || clipId === null || playedId.current === clipId) return;

    const timer = window.setTimeout(() => {
      playedId.current = clipId;
      void play(clipId).then(played => {
        if (!played) onFailure?.();
      });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [clipId, enabled, play, onFailure, delayMs]);
}

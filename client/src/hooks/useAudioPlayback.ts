import { useSyncExternalStore } from "react";
import {
  getAudioPlayback,
  subscribeAudioPlayback,
  type AudioPlaybackState,
} from "@/lib/audioPlayer";

/**
 * The player's now-playing clip and playing state. Views derive their highlight
 * from this instead of keeping a local busy flag that can drift from the audio
 * element.
 */
export function useAudioPlayback(): AudioPlaybackState {
  return useSyncExternalStore(
    subscribeAudioPlayback,
    getAudioPlayback,
    getAudioPlayback
  );
}

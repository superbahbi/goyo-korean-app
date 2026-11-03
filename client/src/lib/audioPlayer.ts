import type { AudioVoice } from "./audioIndex";
import {
  forgetAudioClip,
  getAudioIndex,
  peekAudioIndex,
  resolveAlphabetClip,
  resolveSentenceClip,
  resolveVocabularyClip,
  sentenceIdsWithClips,
  warmAudioClip,
} from "./audioIndex";
import { clearPlayingClip, showPlayingClip } from "./audioPlaybackState";
import { createAudioElementPlayer, PlaybackStoppedError } from "./audioElement";
/**
 * Plays pre-generated Korean audio from /public/audio.
 *
 * The app's domain IDs (for example, surv_001 and cons_001) are intentionally
 * mapped to the generated filename keys so UI components never need to know
 * how audio files are named. The manifest, filename resolution, and offline
 * cache policy live in `audioIndex.ts`; the element lifecycle lives in
 * `audioElement.ts`; the now-playing snapshot lives in `audioPlaybackState.ts`.
 */

export { getAudioPlayback, subscribeAudioPlayback } from "./audioPlaybackState";
export type {
  AudioClipKind,
  AudioClipRef,
  AudioPlaybackState,
} from "./audioPlaybackState";

export type AudioSpeaker = AudioVoice;
let selectedSpeaker: AudioSpeaker = "elevenlabs";

function warmAudioCache(audioPath: string): void {
  // Playback warming is best effort: a failed prefetch must not affect the
  // element. Batch download awaits the same policy and reports failures.
  void warmAudioClip(audioPath).catch(() => {});
}

const player = createAudioElementPlayer({
  warm: warmAudioCache,
  forget: forgetAudioClip,
  onPlaying: showPlayingClip,
  onStopped: clearPlayingClip,
});

/**
 * Resolves true when the clip played to the end or was intentionally stopped,
 * false when it could not start or failed midway. Callers that can show a
 * fallback (the study card) use the result; callers that treat audio as
 * optional may ignore it.
 */
export async function playVocabularyAudio(wordId: string): Promise<boolean> {
  try {
    // When the manifest is already loaded, resolve and trigger playback
    // synchronously without awaiting first, so mobile Safari retains user
    // gesture activation.
    const loaded = peekAudioIndex();
    if (loaded) {
      const audioFile = resolveVocabularyClip(loaded, wordId, selectedSpeaker);
      if (!audioFile) {
        throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
      }
      await player.play(`/audio/${audioFile}`, {
        kind: "vocabulary",
        id: wordId,
      });
      return true;
    }

    const index = await getAudioIndex();
    const audioFile = resolveVocabularyClip(index, wordId, selectedSpeaker);
    if (!audioFile) {
      throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
    }

    await player.play(`/audio/${audioFile}`, {
      kind: "vocabulary",
      id: wordId,
    });
    return true;
  } catch (error) {
    // Stopping a clip (closing a session, moving to the next card) is expected,
    // not a playback failure, so do not log it or show the fallback toast.
    if (error instanceof PlaybackStoppedError) return true;
    console.error("Vocabulary audio failed:", error);
    return false;
  }
}

export async function playAlphabetAudio(
  characterId: string,
  type: "consonant" | "vowel"
): Promise<void> {
  try {
    // Synchronous resolution when the manifest is cached preserves the gesture.
    const loaded = peekAudioIndex();
    if (loaded) {
      const audioFile = resolveAlphabetClip(
        loaded,
        characterId,
        type,
        selectedSpeaker
      );
      if (!audioFile) {
        throw new Error(`No generated audio mapped for ${type} ${characterId}`);
      }
      await player.play(`/audio/${audioFile}`, {
        kind: "alphabet",
        id: characterId,
      });
      return;
    }

    const index = await getAudioIndex();
    const audioFile = resolveAlphabetClip(
      index,
      characterId,
      type,
      selectedSpeaker
    );
    if (!audioFile) {
      throw new Error(`No generated audio mapped for ${type} ${characterId}`);
    }

    await player.play(`/audio/${audioFile}`, {
      kind: "alphabet",
      id: characterId,
    });
  } catch (error) {
    if (error instanceof PlaybackStoppedError) return;
    console.error("Alphabet audio failed:", error);
  }
}

/**
 * Plays the example sentence for a card or grammar example. Returns false when
 * the clip is missing or cannot start, so a caller that offers the button can
 * explain why nothing happened.
 */
export async function playSentenceAudio(sentenceId: string): Promise<boolean> {
  try {
    const index = peekAudioIndex() ?? (await getAudioIndex());
    const audioFile = resolveSentenceClip(index, sentenceId, selectedSpeaker);
    if (!audioFile) {
      throw new Error(`No sentence audio mapped for ${sentenceId}`);
    }
    await player.play(`/audio/${audioFile}`, {
      kind: "sentence",
      id: sentenceId,
    });
    return true;
  } catch (error) {
    if (error instanceof PlaybackStoppedError) return true;
    console.error("Sentence audio failed:", error);
    return false;
  }
}

/**
 * Sentence ids that have a clip in at least one voice. UI uses this to show the
 * sentence player only where audio exists, since the library is generated in
 * batches and older users may have a stale offline index.
 */
export async function getAvailableSentenceIds(): Promise<Set<string>> {
  try {
    return sentenceIdsWithClips(await getAudioIndex());
  } catch {
    return new Set();
  }
}

export function stopAudio(): void {
  player.stop();
}

export function setAudioSpeaker(speaker: AudioSpeaker): void {
  selectedSpeaker = speaker;
  stopAudio();
}

export function getAudioSpeaker(): AudioSpeaker {
  return selectedSpeaker;
}

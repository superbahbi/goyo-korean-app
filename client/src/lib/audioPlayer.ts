/**
 * Audio Player Utility
 * Plays pre-generated Korean voice files from /public/audio/
 */

interface AudioIndex {
  vocabulary: Record<string, string>;
  alphabet: {
    consonants: Record<string, string>;
    vowels: Record<string, string>;
  };
}

let audioIndex: AudioIndex | null = null;
let currentAudio: HTMLAudioElement | null = null;

/**
 * Load the audio index file
 */
async function loadAudioIndex(): Promise<AudioIndex> {
  if (audioIndex) return audioIndex;

  try {
    const response = await fetch("/audio/index.json");
    if (!response.ok) throw new Error("Failed to load audio index");
    audioIndex = await response.json();
    console.log("Audio index loaded:", audioIndex);
    return audioIndex;
  } catch (error) {
    console.error("Error loading audio index:", error);
    throw error;
  }
}

/**
 * Play a vocabulary word's audio
 */
export async function playVocabularyAudio(wordId: string): Promise<void> {
  try {
    console.log("Playing vocabulary audio for:", wordId);
    const index = await loadAudioIndex();
    const audioFile = index.vocabulary[wordId];

    if (!audioFile) {
      console.warn(`No audio found for vocabulary word: ${wordId}`);
      return;
    }

    console.log("Audio file:", audioFile);
    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Error playing vocabulary audio:", error);
  }
}

/**
 * Play an alphabet character's audio
 */
export async function playAlphabetAudio(
  characterId: string,
  type: "consonant" | "vowel"
): Promise<void> {
  try {
    console.log("Playing alphabet audio for:", characterId, type);
    const index = await loadAudioIndex();
    const audioFile =
      type === "consonant"
        ? index.alphabet.consonants[characterId]
        : index.alphabet.vowels[characterId];

    if (!audioFile) {
      console.warn(`No audio found for alphabet character: ${characterId}`);
      return;
    }

    console.log("Audio file:", audioFile);
    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Error playing alphabet audio:", error);
  }
}

/**
 * Play an audio file from the given path
 */
function playAudioFile(audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log("Playing audio from:", audioPath);

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create new audio element
      currentAudio = new Audio();
      currentAudio.src = audioPath;
      currentAudio.playbackRate = 0.9; // Slightly slower for learning
      currentAudio.volume = 1.0;

      // Handle completion
      const onEnded = () => {
        console.log("Audio playback ended");
        cleanup();
        resolve();
      };

      // Handle errors
      const onError = () => {
        console.error("Audio playback error:", currentAudio?.error);
        cleanup();
        reject(new Error(`Failed to play audio: ${currentAudio?.error?.message}`));
      };

      // Handle abort
      const onAbort = () => {
        console.log("Audio playback aborted");
        cleanup();
        reject(new Error("Audio playback aborted"));
      };

      const cleanup = () => {
        if (currentAudio) {
          currentAudio.removeEventListener("ended", onEnded);
          currentAudio.removeEventListener("error", onError);
          currentAudio.removeEventListener("abort", onAbort);
        }
      };

      currentAudio.addEventListener("ended", onEnded);
      currentAudio.addEventListener("error", onError);
      currentAudio.addEventListener("abort", onAbort);

      // Play the audio
      const playPromise = currentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio started playing");
          })
          .catch((error) => {
            console.error("Failed to play audio:", error);
            cleanup();
            reject(error);
          });
      }
    } catch (error) {
      console.error("Error in playAudioFile:", error);
      reject(error);
    }
  });
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

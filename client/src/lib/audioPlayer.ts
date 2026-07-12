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
    const index = await loadAudioIndex();
    const audioFile = index.vocabulary[wordId];

    if (!audioFile) {
      console.warn(`No audio found for vocabulary word: ${wordId}`);
      return;
    }

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
    const index = await loadAudioIndex();
    const audioFile =
      type === "consonant"
        ? index.alphabet.consonants[characterId]
        : index.alphabet.vowels[characterId];

    if (!audioFile) {
      console.warn(`No audio found for alphabet character: ${characterId}`);
      return;
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Error playing alphabet audio:", error);
  }
}

/**
 * Play an audio file from the given path
 */
async function playAudioFile(audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create new audio element
      currentAudio = new Audio(audioPath);
      currentAudio.playbackRate = 0.9; // Slightly slower for learning

      // Handle completion
      currentAudio.onended = () => {
        resolve();
      };

      // Handle errors
      currentAudio.onerror = (error) => {
        console.error("Audio playback error:", error);
        reject(error);
      };

      // Play the audio
      currentAudio.play().catch((error) => {
        console.error("Failed to play audio:", error);
        reject(error);
      });
    } catch (error) {
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

/**
 * Plays pre-generated Korean audio from /public/audio.
 *
 * The app's domain IDs (for example, surv_001 and cons_001) are intentionally
 * mapped to the generated filename keys so UI components never need to know
 * how audio files are named.
 */

interface AudioIndex {
  vocabulary: Record<string, string>;
  female?: {
    vocabulary: Record<string, string>;
    alphabet: {
      consonants: Record<string, string>;
      vowels: Record<string, string>;
    };
  };
  alphabet: {
    consonants: Record<string, string>;
    vowels: Record<string, string>;
  };
}

let audioIndex: AudioIndex | null = null;
let currentAudio: HTMLAudioElement | null = null;
export type AudioSpeaker = "elevenlabs" | "elevenlabs-female";
let selectedSpeaker: AudioSpeaker = "elevenlabs";

const vocabularyAudioAliases: Record<string, string> = {
  surv_001: "hello",
  surv_002: "thank_you",
  surv_003: "sorry",
  surv_004: "yes",
  surv_005: "no",
  surv_007: "help",
  surv_008: "bathroom",
  daily_001: "nice_to_meet",
  daily_002: "how_are_you",
  num_001: "one",
  num_002: "two",
  num_003: "three",
  num_004: "four",
  num_005: "five",
  food_001: "rice",
  food_002: "water",
  food_011: "soup",
  food_014: "meat",
};

const consonantAudioAliases: Record<string, string> = {
  cons_001: "ga",
  cons_002: "na",
  cons_003: "da",
  cons_004: "ra",
  cons_005: "ma",
  cons_006: "ba",
  cons_007: "sa",
  cons_008: "a_consonant",
  cons_009: "ja",
  cons_010: "cha2",
  cons_011: "cha",
  cons_012: "kha",
  cons_013: "ta",
  cons_014: "pha",
  cons_015: "ha",
};

const vowelAudioAliases: Record<string, string> = {
  vowel_001: "a",
  vowel_002: "ya",
  vowel_003: "eo",
  vowel_004: "yeo",
  vowel_005: "o",
  vowel_006: "yo",
  vowel_007: "u",
  vowel_008: "yu",
  vowel_009: "eu",
  vowel_010: "i",
  vowel_011: "ae",
  vowel_012: "e",
};

async function loadAudioIndex(): Promise<AudioIndex> {
  if (audioIndex) return audioIndex;

  const response = await fetch(`/audio/index.json?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Audio index request failed (${response.status})`);
  }

  audioIndex = (await response.json()) as AudioIndex;
  return audioIndex;
}

export async function playVocabularyAudio(wordId: string, fallbackText?: string): Promise<void> {
  try {
    const index = await loadAudioIndex();
    const legacyKey = vocabularyAudioAliases[wordId];
    const vocabularyIndex = selectedSpeaker === "elevenlabs-female" ? index.female?.vocabulary : index.vocabulary;
    const audioFile = vocabularyIndex?.[wordId]
      ?? (legacyKey ? vocabularyIndex?.[legacyKey] : undefined)
      ?? (selectedSpeaker === "elevenlabs-female" ? `elevenlabs_female_${wordId}.mp3` : undefined);

    if (!audioFile) {
      throw new Error(`No ElevenLabs audio mapped for vocabulary ${wordId}`);
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Vocabulary audio failed:", error);
  }
}

export async function playAlphabetAudio(
  characterId: string,
  type: "consonant" | "vowel"
): Promise<void> {
  try {
    const index = await loadAudioIndex();
    const aliases = type === "consonant" ? consonantAudioAliases : vowelAudioAliases;
    const key = aliases[characterId] ?? characterId;
    const alphabetIndex = selectedSpeaker === "elevenlabs-female" ? index.female?.alphabet : index.alphabet;
    const files = type === "consonant" ? alphabetIndex?.consonants : alphabetIndex?.vowels;
    if (!files) throw new Error("Female premium audio index is unavailable");
    const audioFile = files[key]
      ?? (selectedSpeaker === "elevenlabs-female" ? `elevenlabs_female_${characterId}.mp3` : undefined);

    if (!audioFile) {
      throw new Error(`No generated audio mapped for ${type} ${characterId}`);
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Alphabet audio failed:", error);
  }
}

function playAudioFile(audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopAudio();

    const audio = new Audio();
    currentAudio = audio;
    audio.preload = "auto";
    audio.src = audioPath;
    audio.playbackRate = 0.9;
    audio.volume = 1;

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.onabort = null;
      if (currentAudio === audio) currentAudio = null;
    };

    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      const message = audio.error?.message || `Unable to load ${audioPath}`;
      cleanup();
      reject(new Error(message));
    };
    audio.onabort = () => {
      cleanup();
      reject(new Error("Audio playback was stopped"));
    };

    audio.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.onabort = null;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

}

export function isAudioPlaying(): boolean {
  return Boolean(currentAudio && !currentAudio.paused);
}

export function resetAudioIndex(): void {
  audioIndex = null;
}

export function setAudioSpeaker(speaker: AudioSpeaker): void {
  selectedSpeaker = speaker;
  stopAudio();
}

export function getAudioSpeaker(): AudioSpeaker {
  return selectedSpeaker;
}

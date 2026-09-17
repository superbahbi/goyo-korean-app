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
export type AudioSpeaker = "elevenlabs" | "elevenlabs-female" | "system-female" | "system-male";
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

  const response = await fetch("/audio/index.json", { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Audio index request failed (${response.status})`);
  }

  audioIndex = (await response.json()) as AudioIndex;
  return audioIndex;
}

function speakWithBrowserFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      reject(new Error("No pre-generated file or browser speech synthesis is available"));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    const koreanVoices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith("ko"));
    if (koreanVoices.length > 0) {
      const preferredGender = selectedSpeaker === "system-female"
        ? /female|woman|여성|여자/i
        : /male|man|남성|남자/i;
      utterance.voice = koreanVoices.find((voice) => preferredGender.test(voice.name)) ?? koreanVoices[0];
    }
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`Browser speech failed: ${event.error}`));
    window.speechSynthesis.speak(utterance);
  });
}

export async function playVocabularyAudio(wordId: string, fallbackText?: string): Promise<void> {
  try {
    if (selectedSpeaker !== "elevenlabs" && selectedSpeaker !== "elevenlabs-female") {
      if (fallbackText) await speakWithBrowserFallback(fallbackText);
      return;
    }
    const index = await loadAudioIndex();
    const legacyKey = vocabularyAudioAliases[wordId];
    const vocabularyIndex = selectedSpeaker === "elevenlabs-female" ? index.female?.vocabulary : index.vocabulary;
    const audioFile = vocabularyIndex?.[wordId] ?? (legacyKey ? vocabularyIndex?.[legacyKey] : undefined);

    if (!audioFile) {
      if (fallbackText) await speakWithBrowserFallback(fallbackText);
      return;
    }

    await playAudioFile(`/audio/${audioFile}`);
  } catch (error) {
    console.error("Vocabulary audio failed:", error);
    if (fallbackText) {
      try {
        await speakWithBrowserFallback(fallbackText);
      } catch (fallbackError) {
        console.error("Vocabulary browser fallback failed:", fallbackError);
      }
    }
  }
}

export async function playAlphabetAudio(
  characterId: string,
  type: "consonant" | "vowel"
): Promise<void> {
  try {
    if (selectedSpeaker !== "elevenlabs" && selectedSpeaker !== "elevenlabs-female") {
      const character = type === "consonant"
        ? consonantAudioAliases[characterId] ?? characterId
        : vowelAudioAliases[characterId] ?? characterId;
      await speakWithBrowserFallback(character);
      return;
    }
    const index = await loadAudioIndex();
    const aliases = type === "consonant" ? consonantAudioAliases : vowelAudioAliases;
    const key = aliases[characterId] ?? characterId;
    const alphabetIndex = selectedSpeaker === "elevenlabs-female" ? index.female?.alphabet : index.alphabet;
    const files = type === "consonant" ? alphabetIndex?.consonants : alphabetIndex?.vowels;
    if (!files) throw new Error("Female premium audio index is unavailable");
    const audioFile = files[key];

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

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
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

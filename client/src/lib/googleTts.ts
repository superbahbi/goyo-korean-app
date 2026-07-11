/**
 * Google Translate TTS Service
 * Provides high-quality Korean text-to-speech using Google Translate's TTS API
 * No authentication required - works directly in the browser
 */

export async function speakWithGoogleTTS(text: string, language: string = "ko"): Promise<void> {
  try {
    // Clean the text - remove parentheses and extra content for cleaner pronunciation
    const cleanText = text.replace(/\([^)]*\)/g, "").trim();
    
    if (!cleanText) return;

    // Google Translate TTS endpoint
    // This uses the public Google Translate TTS API
    const encodedText = encodeURIComponent(cleanText);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${language}&client=tw-ob`;

    // Create and play audio
    const audio = new Audio(audioUrl);
    audio.playbackRate = 0.9; // Slightly slower for learning
    
    // Stop any currently playing audio
    const allAudio = document.querySelectorAll("audio");
    allAudio.forEach((a) => {
      if (a !== audio) {
        a.pause();
        a.currentTime = 0;
      }
    });

    await audio.play();
  } catch (error) {
    console.error("TTS Error:", error);
    // Fallback to Web Speech API if Google TTS fails
    fallbackToWebSpeechAPI(text, language);
  }
}

/**
 * Fallback to Web Speech API if Google Translate TTS fails
 */
function fallbackToWebSpeechAPI(text: string, language: string): void {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  
  const cleanText = text.replace(/\([^)]*\)/g, "").trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  utterance.lang = language === "ko" ? "ko-KR" : language;
  utterance.rate = 0.9;
  
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  window.speechSynthesis?.cancel();
  
  const allAudio = document.querySelectorAll("audio");
  allAudio.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

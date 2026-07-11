/**
 * Korean Text-to-Speech Service
 * Uses Web Speech API with fallback to alternative methods
 */

export async function speakWithGoogleTTS(text: string, language: string = "ko"): Promise<void> {
  try {
    // Clean the text - remove parentheses and extra content for cleaner pronunciation
    const cleanText = text.replace(/\([^)]*\)/g, "").trim();
    
    if (!cleanText) return;

    // Use Web Speech API (most reliable for browser)
    await speakWithWebSpeechAPI(cleanText, language);
  } catch (error) {
    console.error("TTS Error:", error);
  }
}

/**
 * Web Speech API implementation
 */
function speakWithWebSpeechAPI(text: string, language: string): Promise<void> {
  return new Promise((resolve) => {
    // Cancel any existing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    if (language === "ko") {
      utterance.lang = "ko-KR";
    } else {
      utterance.lang = language;
    }
    
    // Set speech parameters for learning
    utterance.rate = 0.85; // Slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Handle completion
    utterance.onend = () => {
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      resolve();
    };
    
    // Speak the text
    if (window.speechSynthesis) {
      window.speechSynthesis.speak(utterance);
    } else {
      resolve();
    }
  });
}

/**
 * Stop any currently playing audio
 */
export function stopAudio(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

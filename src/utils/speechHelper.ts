// Helper for Web Speech Synthesis (Text-to-Speech)
// Gives voice readout so users of all literacy levels can hear their status

export function speakText(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Slightly slower, very clear and friendly
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis not allowed or supported', err);
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

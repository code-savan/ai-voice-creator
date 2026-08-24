/**
 * Utilities for Audio synthesis, formatting, and file downloads
 */

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function downloadWavFile(base64Data: string, filename: string = "synthesized-speech.wav") {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function base64ToBlobUrl(base64Data: string, mimeType: string = "audio/wav"): string {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Browser Speech Synthesis API fallback
 */
export class BrowserSpeechHelper {
  private static synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public static speak({
    text,
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    voiceName,
    onStart,
    onEnd,
    onError,
  }: {
    text: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceName?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): () => void {
    if (!this.synth) {
      if (onError) onError(new Error("Speech synthesis not supported in this environment."));
      return () => {};
    }

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (voiceName) {
      const voices = this.getVoices();
      const match = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      if (onError) onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);

    return () => {
      if (this.synth) this.synth.cancel();
    };
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }

  public static resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }
}

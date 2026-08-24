export interface VoiceProfile {
  id: string;
  name: string;
  gender: string;
  character: string;
  accent: string;
  tags: string[];
  avatarColor: string;
  description: string;
  samplePitch?: string;
}

export interface VoiceStyle {
  id: string;
  label: string;
  description: string;
  badge: string;
  iconName: string;
}

export interface SpeechHistoryItem {
  id: string;
  text: string;
  voice: string;
  style: string;
  timestamp: number;
  createdAt?: number;
  audioUrl?: string;
  audioBase64?: string;
  duration?: number;
  durationSeconds?: number;
  textLength: number;
  mode: "gemini-tts" | "dialogue" | "browser-speech";
  isDialogue?: boolean;
  speaker1?: { name: string; voice: string };
  speaker2?: { name: string; voice: string };
  dialogueDetails?: {
    speaker1: { name: string; voice: string };
    speaker2: { name: string; voice: string };
  };
}

export interface PresetScript {
  id: string;
  title: string;
  category: "Story & Narrative" | "Meditation & Calm" | "Marketing & Promo" | "Tech & News" | "Dialogue & Podcast" | "Expressive Quotes";
  text: string;
  recommendedVoice: string;
  recommendedStyle: string;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isLooping: boolean;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { VoiceProfile, PresetScript, SpeechHistoryItem } from "./types";
import { VOICES, STYLES, PRESET_SCRIPTS } from "./data/voices";
import { Navbar } from "./components/Navbar";
import { VoiceSelector } from "./components/VoiceSelector";
import { StyleSelector } from "./components/StyleSelector";
import { AudioWaveformPlayer } from "./components/AudioWaveformPlayer";
import { PresetModal } from "./components/PresetModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { ScriptEnhancerModal } from "./components/ScriptEnhancerModal";
import { DialogueModeEditor } from "./components/DialogueModeEditor";
import { BrowserSpeechHelper, base64ToBlobUrl, formatTime } from "./utils/audio";
import {
  Sparkles,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Wand2,
  Users,
  User,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  Clock,
  Type,
  CornerDownLeft,
  Loader2,
  Trash2,
  Mic,
  Sliders,
  ChevronRight,
  Headphones,
} from "lucide-react";

type MobileTab = "editor" | "voices" | "styles" | "dialogue";

export default function App() {
  const [text, setText] = useState<string>(
    "Welcome to the Text to Speech Studio! Type or paste any text here, choose from 20 lifelike voice personas, and explore expressive delivery styles with real-time waveform visualization."
  );
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [selectedStyle, setSelectedStyle] = useState<string>("natural");
  const [customInstruction, setCustomInstruction] = useState<string>("");

  // Mobile active tab navigation
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>("editor");

  // Mode: Single voice vs 2-Speaker Dialogue
  const [isDialogueMode, setIsDialogueMode] = useState<boolean>(false);
  const [speaker1, setSpeaker1] = useState({ name: "Alex", voice: "Kore" });
  const [speaker2, setSpeaker2] = useState({ name: "Jordan", voice: "Puck" });

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio outputs
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [lastGeneratedText, setLastGeneratedText] = useState<string>("");
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Modals & Drawers
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isEnhancerOpen, setIsEnhancerOpen] = useState<boolean>(false);

  // Spoken History
  const [history, setHistory] = useState<SpeechHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("tts_studio_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Browser Fallback state
  const [useBrowserSpeech, setUseBrowserSpeech] = useState<boolean>(false);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  // Save history to local storage
  useEffect(() => {
    try {
      localStorage.setItem("tts_studio_history", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  }, [history]);

  // Word, char and approx timing
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 140) * 60));

  // Quick Voice Preview Sample
  const handlePreviewVoice = async (voice: VoiceProfile) => {
    if (previewingVoiceId) return;
    setPreviewingVoiceId(voice.id);

    const sampleSentence = `Hello! I'm ${voice.name}, ready to bring your words to life with natural clarity.`;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleSentence,
          voice: voice.id,
          style: "cheerful",
        }),
      });
      const data = await res.json();
      if (res.ok && data.audioBase64) {
        const url = base64ToBlobUrl(data.audioBase64);
        const tempAudio = new Audio(url);
        tempAudio.onended = () => {
          setPreviewingVoiceId(null);
          URL.revokeObjectURL(url);
        };
        tempAudio.onerror = () => {
          setPreviewingVoiceId(null);
        };
        await tempAudio.play();
      } else {
        // Fallback to browser speech
        BrowserSpeechHelper.speak({
          text: sampleSentence,
          onEnd: () => setPreviewingVoiceId(null),
          onError: () => setPreviewingVoiceId(null),
        });
      }
    } catch {
      BrowserSpeechHelper.speak({
        text: sampleSentence,
        onEnd: () => setPreviewingVoiceId(null),
        onError: () => setPreviewingVoiceId(null),
      });
    }
  };

  // Main Speech Generation Handler
  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      setErrorMessage("Please enter some text to speak.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    // Stop any ongoing browser speech
    BrowserSpeechHelper.stop();
    setIsBrowserSpeaking(false);

    try {
      const payload = isDialogueMode
        ? {
            text: text.trim(),
            multiSpeaker: true,
            dialogueSpeakers: [speaker1, speaker2],
          }
        : {
            text: text.trim(),
            voice: selectedVoice,
            style: selectedStyle,
            customStyleInstruction: customInstruction,
          };

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate speech audio.");
      }

      if (data.audioBase64) {
        const blobUrl = base64ToBlobUrl(data.audioBase64);
        setAudioUrl(blobUrl);
        setBase64Audio(data.audioBase64);
        setAudioDuration(data.approxDurationSeconds || estimatedSeconds);
        setLastGeneratedText(text.trim());

        // Switch to editor tab on mobile so player is instantly visible
        setActiveMobileTab("editor");

        // Add to history
        const newItem: SpeechHistoryItem = {
          id: `speech_${Date.now()}`,
          text: text.trim(),
          voice: isDialogueMode
            ? `${speaker1.name} & ${speaker2.name}`
            : selectedVoice,
          style: isDialogueMode ? "dialogue" : selectedStyle,
          timestamp: Date.now(),
          createdAt: Date.now(),
          duration: data.approxDurationSeconds || estimatedSeconds,
          durationSeconds: data.approxDurationSeconds || estimatedSeconds,
          textLength: text.trim().length,
          mode: isDialogueMode ? "dialogue" : "gemini-tts",
          audioBase64: data.audioBase64,
          isDialogue: isDialogueMode,
          speaker1: isDialogueMode ? speaker1 : undefined,
          speaker2: isDialogueMode ? speaker2 : undefined,
        };

        setHistory((prev) => [newItem, ...prev.slice(0, 49)]);

        // Smooth scroll to player on mobile
        setTimeout(() => {
          if (playerSectionRef.current) {
            playerSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 100);
      }
    } catch (err: any) {
      console.warn("TTS API Error:", err.message);
      setErrorMessage(
        `${err.message}. ${
          useBrowserSpeech
            ? "Falling back to browser speech synthesis."
            : "You can try browser speech synthesis fallback from the top bar."
        }`
      );

      // Automatic fallback if enabled or requested
      if (useBrowserSpeech) {
        setIsBrowserSpeaking(true);
        BrowserSpeechHelper.speak({
          text: text.trim(),
          onEnd: () => setIsBrowserSpeaking(false),
          onError: () => setIsBrowserSpeaking(false),
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Select Preset Script
  const handleSelectPreset = (preset: PresetScript) => {
    setText(preset.text);
    if (preset.category === "Dialogue & Podcast") {
      setIsDialogueMode(true);
    } else {
      setIsDialogueMode(false);
      setSelectedVoice(preset.recommendedVoice);
      setSelectedStyle(preset.recommendedStyle);
    }
    setIsPresetsOpen(false);
    setActiveMobileTab("editor");
  };

  // Play from History
  const handlePlayHistoryItem = (item: SpeechHistoryItem) => {
    setText(item.text);
    if (item.isDialogue && item.speaker1 && item.speaker2) {
      setIsDialogueMode(true);
      setSpeaker1(item.speaker1);
      setSpeaker2(item.speaker2);
    } else {
      setIsDialogueMode(false);
      setSelectedVoice(item.voice);
      setSelectedStyle(item.style);
    }

    if (item.audioBase64) {
      const url = base64ToBlobUrl(item.audioBase64);
      setAudioUrl(url);
      setBase64Audio(item.audioBase64);
      setAudioDuration(item.durationSeconds || estimatedSeconds);
      setLastGeneratedText(item.text);
      setActiveMobileTab("editor");
    } else {
      BrowserSpeechHelper.speak({ text: item.text });
    }
    setIsHistoryOpen(false);
  };

  // Insert dialogue tag helper
  const handleInsertSpeakerTag = (name: string) => {
    const tag = `${name}: `;
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText =
      text.substring(0, start) +
      (start > 0 && text[start - 1] !== "\n" ? "\n" : "") +
      tag +
      text.substring(end);
    setText(newText);
    setTimeout(() => {
      el.focus();
      const newPos = start + tag.length + (start > 0 && text[start - 1] !== "\n" ? 1 : 0);
      el.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to speak
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateSpeech();
    }
  };

  const selectedVoiceObj = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];
  const selectedStyleObj = STYLES.find((s) => s.id === selectedStyle) || STYLES[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 pb-20 lg:pb-8">
      {/* Top Navigation */}
      <Navbar
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-8 sm:gap-12">
        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-amber-700 hover:text-amber-950 dark:hover:text-white font-bold px-2 py-1 rounded text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile Segmented Navigation Tabs (< lg screens) */}
        <div className="lg:hidden flex items-center bg-zinc-200/70 dark:bg-zinc-900 p-1 rounded-2xl text-xs font-semibold shadow-inner border border-zinc-300/40 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveMobileTab("editor")}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
              activeMobileTab === "editor"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editor &amp; Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("voices")}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
              activeMobileTab === "voices"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>20 Voices</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("styles")}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
              activeMobileTab === "styles"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Styles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDialogueMode(true);
              setActiveMobileTab("dialogue");
            }}
            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl transition-all ${
              activeMobileTab === "dialogue"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dialogue</span>
          </button>
        </div>

        {/* Workspace Bento Grid (Full 2-column view on desktop lg+, tab-filtered on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Script Editor & Active Player (7 cols on lg) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-4 sm:gap-5 ${
              activeMobileTab !== "editor" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Text Editor Box */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-5 flex flex-col gap-3.5">
              {/* Box Header: Title, Active Voice Pill, Mode Switcher */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <label
                      htmlFor="speech-text-input"
                      className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white block font-serif tracking-tight"
                    >
                      Script
                    </label>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Voice:{" "}
                      <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">
                        {isDialogueMode
                          ? `${speaker1.name} & ${speaker2.name}`
                          : selectedVoiceObj.name}
                      </strong>{" "}
                      •{" "}
                      <span className="capitalize">
                        {isDialogueMode ? "Dialogue" : selectedStyleObj.label}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Mode Switcher: Single Voice vs Dialogue */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full text-xs font-medium border border-zinc-200/50 dark:border-zinc-800/50">
                  <button
                    id="mode-single-speaker"
                    type="button"
                    onClick={() => setIsDialogueMode(false)}
                    className={`min-h-[32px] flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors ${
                      !isDialogueMode
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Single</span>
                  </button>
                  <button
                    id="mode-dialogue-speaker"
                    type="button"
                    onClick={() => {
                      setIsDialogueMode(true);
                      if (!text.includes("Alex:") && !text.includes("Jordan:")) {
                        const dialogueSample = PRESET_SCRIPTS.find(
                          (p) => p.category === "Dialogue & Podcast"
                        );
                        if (dialogueSample) setText(dialogueSample.text);
                      }
                    }}
                    className={`min-h-[32px] flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors ${
                      isDialogueMode
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Dialogue</span>
                  </button>
                </div>
              </div>

              {/* Dialogue Config if in Dialogue Mode */}
              {isDialogueMode && (
                <DialogueModeEditor
                  speaker1={speaker1}
                  speaker2={speaker2}
                  onChangeSpeaker1={setSpeaker1}
                  onChangeSpeaker2={setSpeaker2}
                  onInsertSpeakerTag={handleInsertSpeakerTag}
                />
              )}

              {/* Main Textarea */}
              <div className="relative">
                <textarea
                  id="speech-text-input"
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or paste the speech text here..."
                  rows={isDialogueMode ? 6 : 7}
                  className="w-full text-sm sm:text-base leading-relaxed p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 resize-y transition-all font-sans"
                />
              </div>

              {/* Bottom bar of editor: counts & quick helpers */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{charCount} chars</span>
                  </span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>~{estimatedSeconds}s audio</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* AI Script Polish */}
                  <button
                    id="open-script-enhancer-btn"
                    type="button"
                    onClick={() => setIsEnhancerOpen(true)}
                    className="min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-semibold text-xs"
                    title="Improve phrasing, cadence and breathing pauses"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Enhance</span>
                  </button>

                  {/* Clear text */}
                  {text && (
                    <button
                      type="button"
                      onClick={() => setText("")}
                      className="min-h-[36px] min-w-[36px] rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                      title="Clear text"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  id="generate-speak-btn"
                  type="button"
                  onClick={handleGenerateSpeech}
                  disabled={isGenerating || !text.trim()}
                  className="min-h-[56px] flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm sm:text-base font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Synthesizing Studio Audio (24kHz)...</span>
                    </>
                  ) : isBrowserSpeaking ? (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      <span>Speaking via Browser Audio...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 stroke-[2.4]" />
                      <span>Generate &amp; Speak</span>
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-normal opacity-70 ml-1 px-2 py-0.5 rounded-full border border-white/20 dark:border-black/20">
                        <CornerDownLeft className="w-2.5 h-2.5" />
                        <span>Cmd+Enter</span>
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Audio Waveform & Player Section */}
            <div ref={playerSectionRef} className="w-full">
              <AudioWaveformPlayer
                audioUrl={audioUrl}
                base64Audio={base64Audio}
                voiceName={
                  isDialogueMode
                    ? `${speaker1.name} & ${speaker2.name}`
                    : selectedVoice
                }
                styleLabel={
                  isDialogueMode ? "2-Speaker Dialogue" : selectedStyle
                }
                textSnippet={lastGeneratedText}
                duration={audioDuration}
              />
            </div>
          </div>

          {/* Right Column: 20 Voice Personas, Styles, and Presets (5 cols on lg) */}
          <div
            className={`lg:col-span-5 flex flex-col gap-4 sm:gap-5 ${
              activeMobileTab === "editor" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Tab: 20 Voice Persona Picker */}
            {(activeMobileTab === "voices" || typeof window === "undefined" || true) && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 ${
                  activeMobileTab !== "voices" && activeMobileTab !== "editor" ? "hidden lg:flex" : ""
                }`}
              >
                <VoiceSelector
                  selectedVoiceId={selectedVoice}
                  onSelectVoice={(id) => {
                    setSelectedVoice(id);
                    if (isDialogueMode) setIsDialogueMode(false);
                  }}
                  onPreviewVoice={handlePreviewVoice}
                  previewingVoiceId={previewingVoiceId}
                />
              </div>
            )}

            {/* Tab: Voice Style & Emotion Delivery */}
            {(activeMobileTab === "styles" || activeMobileTab === "editor") && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 ${
                  activeMobileTab !== "styles" && activeMobileTab !== "editor" ? "hidden lg:flex" : ""
                }`}
              >
                <StyleSelector
                  selectedStyleId={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                  customInstruction={customInstruction}
                  onChangeCustomInstruction={setCustomInstruction}
                />
              </div>
            )}

            {/* Tab: Dialogue Mode Setup for Mobile tab */}
            {activeMobileTab === "dialogue" && (
              <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4">
                <DialogueModeEditor
                  speaker1={speaker1}
                  speaker2={speaker2}
                  onChangeSpeaker1={setSpeaker1}
                  onChangeSpeaker2={setSpeaker2}
                  onInsertSpeakerTag={(tag) => {
                    handleInsertSpeakerTag(tag);
                    setActiveMobileTab("editor");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("editor")}
                  className="min-h-[44px] w-full py-2.5 rounded-xl bg-zinc-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Go to Script Editor &amp; Generate</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Inspiration Presets Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  Sample Voice Scripts
                </span>
                <button
                  type="button"
                  onClick={() => setIsPresetsOpen(true)}
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors min-h-[32px] flex items-center"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_SCRIPTS.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm group"
                  >
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate group-hover:text-zinc-900 dark:group-hover:text-white">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-zinc-600 block truncate mt-0.5">
                      {p.recommendedVoice} • {p.recommendedStyle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Quick Action on Mobile when exploring Voices/Styles */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 p-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shadow-lg pb-safe">
        <button
          type="button"
          onClick={() => {
            if (activeMobileTab !== "editor") {
              setActiveMobileTab("editor");
            } else {
              handleGenerateSpeech();
            }
          }}
          disabled={isGenerating || !text.trim()}
          className="min-h-[46px] flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-bold shadow-sm active:scale-[0.98] transition-transform"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : activeMobileTab !== "editor" ? (
            <>
              <FileText className="w-4 h-4" />
              <span>Back to Editor ({selectedVoiceObj.name})</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Generate &amp; Speak</span>
            </>
          )}
        </button>

        {audioUrl && (
          <button
            type="button"
            onClick={() => {
              setActiveMobileTab("editor");
              if (playerSectionRef.current) {
                playerSectionRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="min-h-[46px] px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5"
            title="Jump to audio player"
          >
            <Headphones className="w-4 h-4" />
            <span>Player</span>
          </button>
        )}
      </div>

      {/* Preset Modal */}
      <PresetModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onPlayItem={handlePlayHistoryItem}
        onClearHistory={() => setHistory([])}
        onDeleteItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
      />

      {/* Script Enhancer Modal */}
      <ScriptEnhancerModal
        isOpen={isEnhancerOpen}
        onClose={() => setIsEnhancerOpen(false)}
        currentText={text}
        onApplyEnhancedText={setText}
      />
    </div>
  );
}

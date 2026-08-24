/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { VoiceProfile, PresetScript, SpeechHistoryItem } from "./types";
import { VOICES, STYLES, PRESET_SCRIPTS } from "./data/voices";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
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
  BookOpen,
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
  const [activeRightPanel, setActiveRightPanel] = useState<"settings" | "voice-selection">("settings");

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
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 overflow-hidden">
      {/* Left Global Navigation */}
      <Sidebar />

      {/* Main Center Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 relative">
        
        {/* Mobile Header (Hidden on LG) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h1 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
              Text to Speech
            </h1>
          </div>
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Header / Top Bar (Desktop) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-semibold text-sm">Text to Speech</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Feedback
            </button>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Docs
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full gap-8">
          
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

          {/* Text Editor Box */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <textarea
              id="speech-text-input"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
              className="flex-1 w-full text-lg sm:text-xl leading-relaxed bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-hidden resize-none font-sans"
            />
            
            {/* Get Started With Chips */}
            {!text && (
              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800/50">
                <p className="text-xs font-medium text-zinc-500 mb-3">Get started with</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleSelectPreset(PRESET_SCRIPTS[0])} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors bg-white/50 dark:bg-zinc-900/50 shadow-xs">
                    <BookOpen className="w-4 h-4 text-zinc-500" /> Narrate a story
                  </button>
                  <button onClick={() => handleSelectPreset(PRESET_SCRIPTS[1])} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors bg-white/50 dark:bg-zinc-900/50 shadow-xs">
                    <Sparkles className="w-4 h-4 text-zinc-500" /> Record an advertisement
                  </button>
                  <button onClick={() => { setIsDialogueMode(true); handleSelectPreset(PRESET_SCRIPTS.find(p => p.category === "Dialogue & Podcast")!); }} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors bg-white/50 dark:bg-zinc-900/50 shadow-xs">
                    <Users className="w-4 h-4 text-zinc-500" /> Introduce your podcast
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Audio Player Area (if generated) */}
          <div ref={playerSectionRef} className="w-full shrink-0">
            {audioUrl ? (
              <AudioWaveformPlayer
                audioUrl={audioUrl}
                base64Audio={base64Audio}
                voiceName={isDialogueMode ? `${speaker1.name} & ${speaker2.name}` : selectedVoice}
                styleLabel={isDialogueMode ? "2-Speaker Dialogue" : selectedStyle}
                textSnippet={lastGeneratedText}
                duration={audioDuration}
              />
            ) : null}
          </div>

          {/* Primary Action Button (Mobile Only, Desktop handled in right panel or fixed bottom) */}
          <div className="lg:hidden sticky bottom-0 pt-4 pb-8 bg-gradient-to-t from-zinc-50 via-zinc-50 dark:from-zinc-950 dark:via-zinc-950 to-transparent z-10">
             <button
                id="generate-speak-btn-mobile"
                type="button"
                onClick={handleGenerateSpeech}
                disabled={isGenerating || !text.trim()}
                className="w-full min-h-[56px] flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm sm:text-base font-bold shadow-sm transition-transform"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
          </div>
        </div>
      </main>

      {/* Right Settings Sidebar */}
      <aside className="hidden lg:flex w-[380px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col shrink-0 relative shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
        
        {activeRightPanel === "settings" && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-6 px-6 pt-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <button className="pb-3 text-sm font-semibold border-b-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100">
                Settings
              </button>
              <button onClick={() => setIsHistoryOpen(true)} className="pb-3 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 pb-32">
              
              {/* Settings Group: Mode */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Mode</h3>
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-medium border border-zinc-200/50 dark:border-zinc-800/50">
                  <button
                    onClick={() => setIsDialogueMode(false)}
                    className={`flex-1 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
                      !isDialogueMode
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Single
                  </button>
                  <button
                    onClick={() => { setIsDialogueMode(true); }}
                    className={`flex-1 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
                      isDialogueMode
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Dialogue
                  </button>
                </div>
              </div>

              {/* Settings Group: Voice */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Voice</h3>
                
                {!isDialogueMode ? (
                  <button 
                    onClick={() => setActiveRightPanel("voice-selection")}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors text-left group shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedVoiceObj.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                        {selectedVoiceObj.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">{selectedVoiceObj.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{selectedVoiceObj.character}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
                  </button>
                ) : (
                  <DialogueModeEditor
                    speaker1={speaker1}
                    speaker2={speaker2}
                    onChangeSpeaker1={setSpeaker1}
                    onChangeSpeaker2={setSpeaker2}
                    onInsertSpeakerTag={handleInsertSpeakerTag}
                  />
                )}
              </div>

              {/* Settings Group: Model */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Model</h3>
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-left shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] flex items-center justify-center">V2</div>
                    <span className="text-sm font-medium">Eleven Multilingual v2</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
              </div>

              {/* Settings Group: Style */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Style Settings</h3>
                <StyleSelector
                  selectedStyleId={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                  customInstruction={customInstruction}
                  onChangeCustomInstruction={setCustomInstruction}
                />
              </div>
            </div>

            {/* Bottom Generate Button Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white dark:from-zinc-950 dark:via-zinc-950 to-transparent pointer-events-none">
              <button
                id="generate-speak-btn"
                type="button"
                onClick={handleGenerateSpeech}
                disabled={isGenerating || !text.trim()}
                className="w-full min-h-[56px] flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600 pointer-events-auto text-sm font-bold shadow-lg transition-transform"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {activeRightPanel === "voice-selection" && (
          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 sticky top-0 bg-white dark:bg-zinc-950 z-10 shrink-0">
              <button 
                onClick={() => setActiveRightPanel("settings")}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <h2 className="text-sm font-bold">Select a voice</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <VoiceSelector
                selectedVoiceId={selectedVoice}
                onSelectVoice={(id) => {
                  setSelectedVoice(id);
                  setActiveRightPanel("settings");
                }}
                onPreviewVoice={handlePreviewVoice}
                previewingVoiceId={previewingVoiceId}
              />
            </div>
          </div>
        )}
      </aside>

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

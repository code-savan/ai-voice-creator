import { useState } from "react";
import { STYLES } from "../data/voices";
import {
  Volume2,
  Sparkles,
  CloudSun,
  Briefcase,
  Flame,
  BookOpen,
  Wind,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (styleId: string) => void;
  customInstruction: string;
  onChangeCustomInstruction: (val: string) => void;
}

export function StyleSelector({
  selectedStyleId,
  onSelectStyle,
  customInstruction,
  onChangeCustomInstruction,
}: StyleSelectorProps) {
  const [showCustomPrompt, setShowCustomPrompt] = useState<boolean>(
    Boolean(customInstruction && customInstruction.trim().length > 0)
  );

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "CloudSun":
        return <CloudSun className="w-4 h-4 text-sky-500" />;
      case "Briefcase":
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case "Flame":
        return <Flame className="w-4 h-4 text-rose-500" />;
      case "BookOpen":
        return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case "Wind":
        return <Wind className="w-4 h-4 text-zinc-400" />;
      case "Volume2":
      default:
        return <Volume2 className="w-4 h-4 text-zinc-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            Voice Style & Emotional Delivery
          </h2>
        </div>

        <button
          id="toggle-custom-style-instruction"
          type="button"
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
        >
          {showCustomPrompt ? "Hide custom cue" : "+ Custom style cue"}
          {showCustomPrompt ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Preset Style Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {STYLES.map((style) => {
          const isSelected = selectedStyleId === style.id && !customInstruction.trim();

          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              type="button"
              onClick={() => {
                onSelectStyle(style.id);
                // When selecting a preset, clear the custom instruction if desired or keep it secondary
              }}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-500 text-zinc-950 dark:text-zinc-100 ring-2 ring-zinc-500/20"
                  : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-200"
              }`}
            >
              <div className="mt-0.5 p-1 rounded-lg bg-zinc-50 dark:bg-zinc-700/60 shrink-0">
                {getIcon(style.iconName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate">
                    {style.label}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Instruction Input */}
      {showCustomPrompt && (
        <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/50 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-900 dark:text-zinc-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              Custom Emotion / Roleplay Prompt Instruction:
            </span>
            {customInstruction && (
              <button
                type="button"
                onClick={() => onChangeCustomInstruction("")}
                className="text-[11px] text-zinc-400 hover:text-rose-500"
              >
                Clear
              </button>
            )}
          </div>
          <input
            id="custom-style-prompt-input"
            type="text"
            placeholder="e.g. Speak excitedly like a sports commentator, or Speak like a gentle museum docent..."
            value={customInstruction}
            onChange={(e) => onChangeCustomInstruction(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
          />
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-zinc-600">Quick ideas:</span>
            {[
              "Speak with cosmic wonder and amazement",
              "Speak like an old wise professor",
              "Read like a spooky campfire ghost story",
              "Speak with intense excitement",
            ].map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => onChangeCustomInstruction(idea)}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

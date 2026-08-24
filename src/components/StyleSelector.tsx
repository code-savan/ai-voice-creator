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
  ChevronDown,
  ChevronUp,
  Check,
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
      {/* Preset Style Buttons List */}
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {STYLES.map((style) => {
          const isSelected = selectedStyleId === style.id && !customInstruction.trim();

          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              type="button"
              onClick={() => {
                onSelectStyle(style.id);
              }}
              className={`group flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer min-h-[56px] ${
                isSelected
                  ? "bg-zinc-50/90 dark:bg-zinc-950/50 border-zinc-500 dark:border-zinc-500 shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:scale-[0.99]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 shrink-0">
                  {getIcon(style.iconName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {style.label}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {style.description}
                  </div>
                </div>
              </div>
              
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  isSelected
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-1">
        <button
          id="toggle-custom-style-instruction"
          type="button"
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          {showCustomPrompt ? "Hide custom cue" : "+ Custom style cue"}
          {showCustomPrompt ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Custom Instruction Input */}
      {showCustomPrompt && (
        <div className="p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-900 dark:text-zinc-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              Custom Prompt:
            </span>
            {customInstruction && (
              <button
                type="button"
                onClick={() => onChangeCustomInstruction("")}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Clear
              </button>
            )}
          </div>
          <input
            id="custom-style-prompt-input"
            type="text"
            placeholder="e.g. Speak excitedly like a sports commentator..."
            value={customInstruction}
            onChange={(e) => onChangeCustomInstruction(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-500"
          />
          <div className="flex flex-wrap gap-1.5 text-[11px] mt-1">
            <span className="text-zinc-500 py-0.5">Quick ideas:</span>
            {[
              "Cosmic wonder",
              "Wise professor",
              "Spooky ghost story",
              "Intense excitement",
            ].map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => onChangeCustomInstruction(idea)}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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

import { useState } from "react";
import { PRESET_SCRIPTS } from "../data/voices";
import { PresetScript } from "../types";
import { BookOpen, Sparkles, X, Check, ArrowRight } from "lucide-react";

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetScript) => void;
}

export function PresetModal({ isOpen, onClose, onSelectPreset }: PresetModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  if (!isOpen) return null;

  const categories = [
    "All",
    "Story & Narrative",
    "Meditation & Calm",
    "Marketing & Promo",
    "Tech & News",
    "Dialogue & Podcast",
    "Expressive Quotes",
  ];

  const filteredPresets = PRESET_SCRIPTS.filter((p) => {
    if (activeCategory === "All") return true;
    return p.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div
        id="preset-library-modal"
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                Preset Scripts &amp; Sample Passages
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Choose a pre-crafted passage with optimized voice and emotional style pairings
              </p>
            </div>
          </div>
          <button
            id="close-presets-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-zinc-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of presets */}
        <div className="p-4 overflow-y-auto space-y-3">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              id={`preset-card-${preset.id}`}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800/60 hover:bg-zinc-50/30 dark:hover:bg-zinc-950/20 transition-all cursor-pointer group flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                    {preset.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
                    {preset.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Load script</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                &ldquo;{preset.text}&rdquo;
              </p>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  Voice: {preset.recommendedVoice}
                </span>
                <span>•</span>
                <span className="capitalize">Style: {preset.recommendedStyle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { VoiceProfile } from "../types";
import { VOICES } from "../data/voices";
import { Mic, Check, Volume2, Search, X, Sparkles, Filter } from "lucide-react";

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice?: (voice: VoiceProfile) => void;
  previewingVoiceId?: string | null;
}

export function VoiceSelector({
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  previewingVoiceId,
}: VoiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Common category tags across all 20 voices
  const categoryTags = [
    { id: "all", label: "All Tags" },
    { id: "Storytelling", label: "Storytelling" },
    { id: "Podcast", label: "Podcast" },
    { id: "Cinematic", label: "Cinematic" },
    { id: "Meditation", label: "Meditation" },
    { id: "News", label: "News & Doc" },
    { id: "Explainer", label: "Commercial" },
    { id: "Tech", label: "Tech & Gaming" },
  ];

  const filteredVoices = VOICES.filter((v) => {
    // Gender filter
    if (filterGender === "female" && !v.gender.toLowerCase().includes("female")) {
      return false;
    }
    if (
      filterGender === "male" &&
      (!v.gender.toLowerCase().includes("male") || v.gender.toLowerCase().includes("female"))
    ) {
      return false;
    }

    // Tag filter
    if (selectedTag !== "all" && !v.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchAccent = v.accent.toLowerCase().includes(q);
      const matchCharacter = v.character.toLowerCase().includes(q);
      const matchTag = v.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchAccent && !matchCharacter && !matchTag) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-3.5">
      {/* Title & Count Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Voice Personas
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300 font-semibold border border-zinc-200/50 dark:border-zinc-800/50">
                {VOICES.length} Voices
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:block">
              Select an AI character profile or test sample delivery
            </p>
          </div>
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-medium border border-zinc-200/50 dark:border-zinc-700/50">
          <button
            id="filter-voice-all"
            type="button"
            onClick={() => setFilterGender("all")}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all ${
              filterGender === "all"
                ? "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All ({VOICES.length})
          </button>
          <button
            id="filter-voice-female"
            type="button"
            onClick={() => setFilterGender("female")}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all ${
              filterGender === "female"
                ? "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Female (10)
          </button>
          <button
            id="filter-voice-male"
            type="button"
            onClick={() => setFilterGender("male")}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all ${
              filterGender === "male"
                ? "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Male (10)
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="search-voice-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search 20 voices by name, accent, or style (e.g. British, Deep, Calm)..."
          className="w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-500/80 focus:bg-white dark:focus:bg-zinc-900 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Tag Filter Chips (Horizontal Scroll on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {categoryTags.map((tag) => (
          <button
            key={tag.id}
            id={`tag-filter-${tag.id.toLowerCase()}`}
            type="button"
            onClick={() => setSelectedTag(tag.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 ${
              selectedTag === tag.id
                ? "bg-zinc-600 text-white font-medium shadow-2xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Voice Cards Grid */}
      {filteredVoices.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-600 text-xs">
          No voice matches &ldquo;{searchQuery}&rdquo;. Try another name or tag.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceId === voice.id;
            const isPreviewing = previewingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                id={`voice-card-${voice.id.toLowerCase()}`}
                onClick={() => onSelectVoice(voice.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer min-h-[64px] ${
                  isSelected
                    ? "bg-zinc-50/90 dark:bg-zinc-950/50 border-zinc-500 dark:border-zinc-500 shadow-sm"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:scale-[0.99]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${voice.avatarColor} text-white flex items-center justify-center font-bold text-[10px] shadow-xs shrink-0`}
                  >
                    {voice.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {voice.name}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate">
                      {voice.character}
                    </span>
                  </div>
                </div>

                {/* Actions (Preview / Check) */}
                <div className="flex items-center gap-2 pl-2 shrink-0">
                  {onPreviewVoice && (
                    <button
                      id={`preview-voice-${voice.id.toLowerCase()}`}
                      type="button"
                      title={`Preview ${voice.name}'s voice`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewVoice(voice);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isPreviewing
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 animate-pulse"
                          : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Volume2 className="w-4 h-4 fill-current" />
                    </button>
                  )}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                        : "opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

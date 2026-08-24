import { useState } from "react";
import { VOICES } from "../data/voices";
import { Users, Plus, MessageSquare } from "lucide-react";

interface SpeakerConfig {
  name: string;
  voice: string;
}

interface DialogueModeEditorProps {
  speaker1: SpeakerConfig;
  speaker2: SpeakerConfig;
  onChangeSpeaker1: (config: SpeakerConfig) => void;
  onChangeSpeaker2: (config: SpeakerConfig) => void;
  onInsertSpeakerTag: (speakerName: string) => void;
}

export function DialogueModeEditor({
  speaker1,
  speaker2,
  onChangeSpeaker1,
  onChangeSpeaker2,
  onInsertSpeakerTag,
}: DialogueModeEditorProps) {
  return (
    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Dual-Speaker Dialogue Setup
          </h3>
        </div>
        <span className="text-[11px] text-zinc-600">
          Format lines as &quot;Name: text&quot;
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Speaker 1 Card */}
        <div className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Speaker 1
            </span>
            <button
              type="button"
              onClick={() => onInsertSpeakerTag(speaker1.name)}
              className="text-[11px] px-2 py-0.5 rounded bg-zinc-50 text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300 hover:bg-zinc-100 flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Insert &ldquo;{speaker1.name}:&rdquo;</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-600 font-medium block mb-1">
                Name in Script
              </label>
              <input
                type="text"
                value={speaker1.name}
                onChange={(e) =>
                  onChangeSpeaker1({ ...speaker1, name: e.target.value })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-500"
                placeholder="Alex"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-600 font-medium block mb-1">
                Voice Persona
              </label>
              <select
                value={speaker1.voice}
                onChange={(e) =>
                  onChangeSpeaker1({ ...speaker1, voice: e.target.value })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-500"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Speaker 2 Card */}
        <div className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Speaker 2
            </span>
            <button
              type="button"
              onClick={() => onInsertSpeakerTag(speaker2.name)}
              className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Insert &ldquo;{speaker2.name}:&rdquo;</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-600 font-medium block mb-1">
                Name in Script
              </label>
              <input
                type="text"
                value={speaker2.name}
                onChange={(e) =>
                  onChangeSpeaker2({ ...speaker2, name: e.target.value })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-500"
                placeholder="Jordan"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-600 font-medium block mb-1">
                Voice Persona
              </label>
              <select
                value={speaker2.voice}
                onChange={(e) =>
                  onChangeSpeaker2({ ...speaker2, voice: e.target.value })
                }
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-500"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { SpeechHistoryItem } from "../types";
import { History, Play, Trash2, Download, Copy, Check, X, Volume2 } from "lucide-react";
import { formatTime, downloadWavFile } from "../utils/audio";
import { useState } from "react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpeechHistoryItem[];
  onPlayItem: (item: SpeechHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onPlayItem,
  onClearHistory,
  onDeleteItem,
}: HistoryDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyText = (item: SpeechHistoryItem) => {
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/50 backdrop-blur-xs">
      <div
        id="history-drawer-panel"
        className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                Spoken History
              </h3>
              <p className="text-xs text-zinc-600">
                {history.length} {history.length === 1 ? "recording" : "recordings"} saved locally
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                title="Clear all history"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="close-history-drawer-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-zinc-400">
              <Volume2 className="w-10 h-10 mb-2 stroke-[1.5] text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                No generations yet
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 mt-1">
                Your synthesized speeches and dialogue recordings will appear here for instant replay and download.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col gap-2 shadow-2xs"
              >
                {/* Voice info & timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300">
                      {item.voice}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 capitalize">
                      {item.style}
                    </span>
                    {item.duration && (
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {formatTime(item.duration)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Text snippet */}
                <p className="text-xs text-zinc-700 dark:text-zinc-200 line-clamp-3 leading-relaxed">
                  {item.text}
                </p>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => onPlayItem(item)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-600 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyText(item)}
                      title="Copy text"
                      className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {item.audioUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = item.audioUrl!;
                          a.download = `speech-${item.voice.toLowerCase()}-${item.timestamp}.wav`;
                          a.click();
                        }}
                        title="Download WAV"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      title="Delete"
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

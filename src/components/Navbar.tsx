import { Volume2, BookOpen, History, Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  useBrowserFallback: boolean;
  onToggleEngine: () => void;
}

export function Navbar({
  onOpenPresets,
  onOpenHistory,
  historyCount,
}: NavbarProps) {
  return (
    <div className="pt-6 sm:pt-8 pb-4 px-4 sm:px-6 w-full flex justify-center sticky top-0 z-40 pointer-events-none">
      <header className="pointer-events-auto flex items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-full px-4 py-2.5 max-w-5xl w-full transition-all">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
              Text to Speech
            </h1>
          </div>
        </div>

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-2">
          {/* Preset Passages Button */}
          <button
            id="nav-open-presets-btn"
            type="button"
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sample Scripts</span>
            <span className="md:hidden">Presets</span>
          </button>

          {/* Spoken History Button */}
          <button
            id="nav-open-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] flex items-center justify-center font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Engine indicator */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400">
              Studio 24kHz
            </span>
          </div>
        </div>
      </header>
    </div>
  );
}

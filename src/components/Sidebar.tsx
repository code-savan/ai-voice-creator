import { Home, Mic, Library, BookOpen, Clock, Settings, UserPlus } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col justify-between overflow-y-auto">
      <div className="py-6 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
            <Mic className="w-4 h-4 stroke-[2.2]" />
          </div>
          <h1 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
            Text to Speech
          </h1>
        </div>

        {/* Primary Nav */}
        <nav className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg transition-colors">
            <Mic className="w-4 h-4" />
            <span>Voices</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
            <Library className="w-4 h-4" />
            <span>Studio</span>
          </button>
        </nav>

        {/* Pinned Section */}
        <div className="mt-8">
          <div className="px-3 mb-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Pinned
          </div>
          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg transition-colors">
              <span className="w-1 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full absolute left-0" />
              <Mic className="w-4 h-4" />
              <span>Text to Speech</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
              <BookOpen className="w-4 h-4" />
              <span>Sample Scripts</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
              <Clock className="w-4 h-4" />
              <span>History</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="p-4">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <UserPlus className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <span>Invite team members</span>
        </button>
      </div>
    </aside>
  );
}

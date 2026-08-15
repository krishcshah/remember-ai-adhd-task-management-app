import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Anchor, Sparkles, SlidersHorizontal, Moon, Sun } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentTab, setCurrentTab, settings, updateSettings, tasks } = useTaskContext();

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const activeCount = tasks.filter((t) => t.status === 'todo').length;

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="w-full bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 sticky top-0 z-30 transition-colors">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setCurrentTab('now')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-800 dark:bg-teal-700 flex items-center justify-center text-amber-400 shadow-sm transition-transform group-hover:scale-105">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-stone-800 dark:text-stone-100 tracking-tight leading-none">
                Anchor
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Right Actions: Theme toggle & Settings */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            aria-label="Settings"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              currentTab === 'settings'
                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

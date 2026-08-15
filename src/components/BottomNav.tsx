import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Target, Calendar as CalendarIcon, FolderKanban, SlidersHorizontal, Plus, BrainCircuit } from 'lucide-react';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture, tasks } = useTaskContext();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'now', label: 'Now', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'library', label: 'Library', icon: FolderKanban },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200/80 dark:border-stone-800 safe-bottom">
      <div className="max-w-xl mx-auto px-4 py-1.5 flex items-center justify-around relative">
        {/* Tab 1: Now */}
        <button
          onClick={() => setCurrentTab('now')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'now'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Target className={`w-5 h-5 ${currentTab === 'now' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Now</span>
        </button>

        {/* Tab 2: Calendar */}
        <button
          onClick={() => setCurrentTab('calendar')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'calendar'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 ${currentTab === 'calendar' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Calendar</span>
        </button>

        {/* Center Floating Action Button (Capture) */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={() => openCapture('quick')}
            aria-label="Capture task or brain dump"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-900 to-teal-700 dark:from-teal-800 dark:to-teal-600 text-amber-300 flex items-center justify-center shadow-lg shadow-teal-900/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-amber-400/40"
          >
            <Plus className="w-7 h-7 stroke-[2.5px]" />
          </button>
        </div>

        {/* Tab 3: Library */}
        <button
          onClick={() => setCurrentTab('library')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'library'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <FolderKanban className={`w-5 h-5 ${currentTab === 'library' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Library</span>
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
            currentTab === 'settings'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <SlidersHorizontal className={`w-5 h-5 ${currentTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};

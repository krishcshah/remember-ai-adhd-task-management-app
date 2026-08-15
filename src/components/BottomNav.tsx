import React from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Target, Calendar as CalendarIcon, FolderKanban, SlidersHorizontal, Plus, BrainCircuit } from 'lucide-react';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture } = useTaskContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200/80 dark:border-stone-800 safe-bottom">
      <div className="max-w-xl mx-auto px-4 pt-1 pb-1 flex items-center justify-around relative">
        {/* Tab 1: Now */}
        <button
          onClick={() => setCurrentTab('now')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'now'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Target className={`w-5 h-5 ${currentTab === 'now' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Now</span>
        </button>

        {/* Tab 2: Calendar */}
        <button
          onClick={() => setCurrentTab('calendar')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'calendar'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 ${currentTab === 'calendar' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Calendar</span>
        </button>

        {/* Center Floating Action Button (Capture) */}
        <div className="relative -top-3.5 flex items-center justify-center">
          <button
            onClick={() => openCapture('quick')}
            aria-label="Capture task or brain dump"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-900 to-teal-700 dark:from-teal-800 dark:to-teal-600 text-amber-300 flex items-center justify-center shadow-lg shadow-teal-900/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-amber-400/40 cursor-pointer"
          >
            <Plus className="w-6.5 h-6.5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Tab 3: Library */}
        <button
          onClick={() => setCurrentTab('library')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'library'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <FolderKanban className={`w-5 h-5 ${currentTab === 'library' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Library</span>
        </button>

        {/* Tab 4: Settings */}
        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'settings'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <SlidersHorizontal className={`w-5 h-5 ${currentTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};

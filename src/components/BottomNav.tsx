import React from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Target, Calendar as CalendarIcon, FolderKanban, SlidersHorizontal, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture } = useTaskContext();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'now', label: 'Now', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'library', label: 'Library', icon: FolderKanban },
    { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200/80 dark:border-stone-800 safe-bottom">
      <div className="max-w-xl mx-auto px-4 pt-1 pb-1 flex items-center justify-around relative">
        {/* Tab 1: Now */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentTab('now')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-colors cursor-pointer relative ${
            currentTab === 'now'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Target className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'now' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Now</span>
          {currentTab === 'now' && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute -bottom-0.5 w-5 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Tab 2: Calendar */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentTab('calendar')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-colors cursor-pointer relative ${
            currentTab === 'calendar'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'calendar' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Calendar</span>
          {currentTab === 'calendar' && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute -bottom-0.5 w-5 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Center Floating Action Button (Capture) */}
        <div className="relative -top-3.5 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openCapture('quick')}
            aria-label="Capture task or brain dump"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-900 to-teal-700 dark:from-teal-800 dark:to-teal-600 text-amber-300 flex items-center justify-center shadow-lg shadow-teal-900/25 hover:shadow-xl transition-shadow border-2 border-amber-400/40 cursor-pointer"
          >
            <Plus className="w-6.5 h-6.5 stroke-[2.5px]" />
          </motion.button>
        </div>

        {/* Tab 3: Library */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentTab('library')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-colors cursor-pointer relative ${
            currentTab === 'library'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <FolderKanban className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'library' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Library</span>
          {currentTab === 'library' && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute -bottom-0.5 w-5 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Tab 4: Settings */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center justify-center w-14 sm:w-16 py-0.5 rounded-xl transition-colors cursor-pointer relative ${
            currentTab === 'settings'
              ? 'text-teal-800 dark:text-teal-400 font-semibold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <SlidersHorizontal className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'settings' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Settings</span>
          {currentTab === 'settings' && (
            <motion.div
              layoutId="bottom-nav-active-pill"
              className="absolute -bottom-0.5 w-5 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            />
          )}
        </motion.button>
      </div>
    </nav>
  );
};

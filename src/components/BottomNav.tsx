import React from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Calendar as CalendarIcon, User, Plus, CheckSquare } from 'lucide-react';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture } = useTaskContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200/80 dark:border-stone-800 safe-bottom">
      <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-between relative">
        {/* Left: Calendar / Tasks View Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer ${
            currentTab === 'calendar'
              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <CheckSquare className="w-5 h-5 stroke-[2.2px]" />
          <span className="text-xs tracking-tight font-medium">Schedule</span>
        </motion.button>

        {/* Center: Prominent Add Task Action Button */}
        <div className="relative -top-3 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openCapture('quick')}
            aria-label="Add task or brain dump"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-teal-900 to-teal-700 dark:from-teal-800 dark:to-teal-600 text-amber-300 flex items-center justify-center shadow-lg shadow-teal-900/30 hover:shadow-xl transition-shadow border-2 border-amber-400/40 cursor-pointer"
          >
            <Plus className="w-6.5 h-6.5 stroke-[2.8px]" />
          </motion.button>
        </div>

        {/* Right: You (Settings & Profile) View Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setCurrentTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2px]" />
          <span className="text-xs tracking-tight font-medium">You</span>
        </motion.button>
      </div>
    </nav>
  );
};

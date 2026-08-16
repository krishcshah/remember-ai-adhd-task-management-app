import React from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Sparkles, Plus, CheckSquare } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture } = useTaskContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-t border-stone-200/80 dark:border-stone-800 safe-bottom select-none">
      <div className="max-w-md mx-auto px-4 py-2 relative flex items-center justify-between h-14">
        {/* Left: Tasks Tab */}
        <div className="flex-1 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap ${
              currentTab === 'calendar'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100/60 dark:hover:bg-stone-800/40'
            }`}
          >
            <CheckSquare className={`w-4.5 h-4.5 stroke-[2.2px] shrink-0 ${
              currentTab === 'calendar'
                ? 'text-stone-800 dark:text-stone-200'
                : 'text-stone-500 dark:text-stone-400'
            }`} />
            <span>Tasks</span>
          </motion.button>
        </div>

        {/* Center: Absolute Fixed Centered Plus Action Button */}
        <div className="shrink-0 flex items-center justify-center z-10 -mt-6">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openCapture('quick')}
            aria-label="Add task or brain dump"
            className="w-12.5 h-12.5 rounded-full bg-teal-800 dark:bg-teal-700 text-teal-50 flex items-center justify-center shadow-lg shadow-teal-900/25 hover:shadow-xl transition-shadow border-2 border-teal-600/40 dark:border-teal-500/40 cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.8px]" />
          </motion.button>
        </div>

        {/* Right: You Tab */}
        <div className="flex-1 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap ${
              currentTab === 'settings'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100/60 dark:hover:bg-stone-800/40'
            }`}
          >
            <Sparkles className={`w-4.5 h-4.5 stroke-[2.2px] shrink-0 ${
              currentTab === 'settings'
                ? 'text-stone-800 dark:text-stone-200'
                : 'text-stone-500 dark:text-stone-400'
            }`} />
            <span>You</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

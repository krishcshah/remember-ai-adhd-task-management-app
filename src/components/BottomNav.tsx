import React from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Sparkles, Plus, CheckSquare } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture } = useTaskContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-none safe-bottom select-none transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 py-2 relative flex items-center justify-between h-14">
        {/* Left: Tasks Tab */}
        <div className="flex-1 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTab('calendar')}
            id="nav-tasks-tab-btn"
            aria-label="Tasks Tab"
            className={`group flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl cursor-pointer font-semibold text-xs whitespace-nowrap transition-all duration-150 ${
              currentTab === 'calendar'
                ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border border-teal-200/70 dark:border-teal-800/50 shadow-xs'
                : 'bg-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <CheckSquare
              className={`w-4.5 h-4.5 stroke-[2.2px] shrink-0 transition-colors ${
                currentTab === 'calendar'
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
              }`}
            />
            <span>Tasks</span>
          </motion.button>
        </div>

        {/* Center: Elevated Plus Action Button */}
        <div className="shrink-0 flex items-center justify-center z-10 -mt-6">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openCapture('quick')}
            id="nav-add-task-btn"
            aria-label="Add task or brain dump"
            className="w-13 h-13 rounded-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-600/30 dark:shadow-teal-950/50 hover:shadow-xl transition-all border-[3px] border-white dark:border-stone-900 ring-1 ring-teal-600/20 dark:ring-teal-400/20 cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.8px]" />
          </motion.button>
        </div>

        {/* Right: You (Statistics & Insights) Tab */}
        <div className="flex-1 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTab('you')}
            id="nav-you-tab-btn"
            aria-label="You and Statistics Tab"
            className={`group flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl cursor-pointer font-semibold text-xs whitespace-nowrap transition-all duration-150 ${
              currentTab === 'you'
                ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border border-teal-200/70 dark:border-teal-800/50 shadow-xs'
                : 'bg-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/60 border border-transparent'
            }`}
          >
            <Sparkles
              className={`w-4.5 h-4.5 stroke-[2.2px] shrink-0 transition-colors ${
                currentTab === 'you'
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
              }`}
            />
            <span>You</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

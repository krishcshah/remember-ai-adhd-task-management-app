import React from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Sparkles, Plus, CheckSquare } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, openCapture } = useTaskContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-800 safe-bottom select-none">
      <div className="max-w-md mx-auto px-4 py-2 relative flex items-center justify-between h-14">
        {/* Left: Tasks Tab */}
        <div className="flex-1 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTab('calendar')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap text-white ${
              currentTab === 'calendar'
                ? 'bg-teal-900/70 border border-teal-600/40 shadow-sm'
                : 'hover:bg-stone-800/60'
            }`}
          >
            <CheckSquare
              className={`w-4.5 h-4.5 stroke-[2.2px] shrink-0 ${
                currentTab === 'calendar'
                  ? 'text-teal-400'
                  : 'text-white'
              }`}
            />
            <span className="text-white">Tasks</span>
          </motion.button>
        </div>

        {/* Center: Absolute Fixed Centered Plus Action Button */}
        <div className="shrink-0 flex items-center justify-center z-10 -mt-6">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => openCapture('quick')}
            aria-label="Add task or brain dump"
            className="w-12.5 h-12.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-950/40 hover:shadow-xl transition-all border-2 border-teal-400/40 cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[2.8px]" />
          </motion.button>
        </div>

        {/* Right: You Tab */}
        <div className="flex-1 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all cursor-pointer font-semibold text-xs whitespace-nowrap text-white ${
              currentTab === 'settings'
                ? 'bg-teal-900/70 border border-teal-600/40 shadow-sm'
                : 'hover:bg-stone-800/60'
            }`}
          >
            <Sparkles
              className={`w-4.5 h-4.5 stroke-[2.2px] shrink-0 ${
                currentTab === 'settings'
                  ? 'text-teal-400'
                  : 'text-white'
              }`}
            />
            <span className="text-white">You</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

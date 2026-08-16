/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { BottomNav } from './components/BottomNav';
import { NowView } from './components/NowView';
import { CalendarView } from './components/CalendarView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { CaptureModal } from './components/CaptureModal';
import { TaskEditModal } from './components/TaskEditModal';
import { RepeatModal } from './components/RepeatModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { FocusTimerOverlay } from './components/FocusTimerOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WifiOff } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    currentTab,
    focusTask,
    stopFocus,
    isAddCategoryOpen,
    closeAddCategoryModal,
  } = useTaskContext();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-700 selection:text-white transition-colors duration-300">
      {/* Offline Notification Bar */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden bg-amber-500 text-stone-950 px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline mode active • Local task planner running</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area with Smooth View Transitions */}
      <main className="flex-1 flex flex-col w-full max-w-xl mx-auto overflow-x-hidden pt-2 sm:pt-3">
        <AnimatePresence mode="wait">
          {currentTab === 'settings' ? (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col w-full"
            >
              <SettingsView />
            </motion.div>
          ) : (
            <motion.div
              key="tab-calendar"
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col w-full"
            >
              <CalendarView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <BottomNav />

      {/* Capture Overlay Modal (Quick Add / Brain Dump) */}
      <CaptureModal />

      {/* Task Edit / Natural Language AI Modal */}
      <TaskEditModal />

      {/* Repeat Schedule Modal */}
      <RepeatModal />

      {/* Add Custom Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={closeAddCategoryModal}
      />

      {/* Fullscreen Playlist Focus Timer */}
      <AnimatePresence>
        {focusTask && <FocusTimerOverlay task={focusTask} onClose={stopFocus} />}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <TaskProvider>
        <MainLayout />
      </TaskProvider>
    </ErrorBoundary>
  );
}

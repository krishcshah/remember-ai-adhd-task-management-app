/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NowView } from './components/NowView';
import { CalendarView } from './components/CalendarView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { CaptureModal } from './components/CaptureModal';
import { TaskEditModal } from './components/TaskEditModal';
import { FocusTimerOverlay } from './components/FocusTimerOverlay';
import { WifiOff } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentTab, focusTask, stopFocus } = useTaskContext();
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
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-700 selection:text-white transition-colors duration-200">
      {/* Offline Notification Bar */}
      {!isOnline && (
        <div className="bg-amber-500 text-stone-950 px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-sm">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode active • Local task planner & offline heuristics running</span>
        </div>
      )}

      {/* App Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-xl mx-auto">
        {currentTab === 'now' && <NowView />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'library' && <LibraryView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Bottom Tab Bar */}
      <BottomNav />

      {/* Capture Overlay Modal (Quick Add / Brain Dump) */}
      <CaptureModal />

      {/* Task Edit / Natural Language AI Modal */}
      <TaskEditModal />

      {/* Fullscreen Playlist Focus Timer */}
      {focusTask && <FocusTimerOverlay task={focusTask} onClose={stopFocus} />}
    </div>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <MainLayout />
    </TaskProvider>
  );
}

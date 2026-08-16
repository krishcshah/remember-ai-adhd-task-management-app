import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { getNotificationPermissionStatus, requestNotificationPermission } from '../utils/notifications';
import {
  Sparkles,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  Check,
  Trash2,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut,
  CalendarClock,
  AlertCircle,
  ExternalLink,
  Copy,
  X,
  Globe,
  User,
  Brain,
  Sliders,
  SlidersHorizontal,
  Bell,
  Volume2,
  VolumeX,
  Clock,
  Play,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    user,
    authError,
    clearAuthError,
    isCloudSyncing,
    cloudLastSynced,
    signInWithGoogle,
    logOut,
    manualCloudSync,
    updateSettings,
    resetAllData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
    setCurrentTab,
    testNotificationChime,
  } = useTaskContext();

  const [contextInput, setContextInput] = useState(settings.context);
  const [copied, setCopied] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState(getNotificationPermissionStatus());
  const [testedChime, setTestedChime] = useState(false);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermStatus(res);
  };

  const handleTestChime = () => {
    testNotificationChime();
    setTestedChime(true);
    setTimeout(() => setTestedChime(false), 2500);
  };

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleOpenInNewWindow = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveContext = () => {
    updateSettings({ context: contextInput });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remember-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('Backup restored successfully!');
      } else {
        setImportStatus('Failed to parse backup file.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 pt-3 pb-24 space-y-6">
      {/* Header - Settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shadow-sm border border-stone-200/80 dark:border-stone-700/80">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              Settings
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {user ? (user.displayName || user.email || 'Personal ADHD System') : 'Preferences & Cloud Sync'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentTab('calendar')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-semibold cursor-pointer transition-colors"
        >
          Done
        </button>
      </div>

      {/* Auto-Rollover Pending Tasks */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Auto-Rollover Pending Tasks</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Move yesterday's unfinished tasks to Today automatically
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoRolloverPending !== false}
              onChange={(e) => updateSettings({ autoRolloverPending: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-800" />
          </label>
        </div>
      </div>

      {/* Life Context for AI Prompting */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">Life Context for AI</h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Injected into every task breakdown and brain-dump sorting call
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          value={contextInput}
          onChange={(e) => setContextInput(e.target.value)}
          placeholder="e.g. I have ADHD, struggle with task paralysis, prefer micro-steps under 15m, working on college thesis and personal project..."
          className="w-full p-3 text-xs rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSaveContext}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {copied ? 'Saved Context!' : 'Update AI Context'}
          </button>
        </div>
      </div>

      {/* Visual Theme Selection */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">Theme Appearance</h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Low-contrast soothing backgrounds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => updateSettings({ theme: 'light' })}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === 'light'
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-900 dark:text-teal-200 ring-2 ring-teal-600/20'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" /> Light
          </button>

          <button
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === 'dark'
                ? 'bg-stone-800 dark:bg-stone-800 border-teal-500 text-teal-300 ring-2 ring-teal-500/20'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Moon className="w-4 h-4 text-teal-400" /> Dark
          </button>

          <button
            onClick={() => updateSettings({ theme: 'system' })}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === 'system'
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-900 dark:text-teal-200 ring-2 ring-teal-600/20'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Monitor className="w-4 h-4 text-stone-500" /> System
          </button>
        </div>
      </div>

      {/* Task Time Notifications & Reminders */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Notifications & Reminders</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Alerts when timed tasks are due
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestChime}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
            title="Play sample chime and trigger test alert"
          >
            {testedChime ? <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Play className="w-3.5 h-3.5" />}
            <span>{testedChime ? 'Chime Played!' : 'Test Reminder'}</span>
          </button>
        </div>

        <div className="space-y-2 pt-1">
          {/* Main Notification Toggle */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Timed Task Reminders
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  Notify you at the exact scheduled time
                </p>
              </div>
            </div>

            <button
              id="toggle-notifications-btn"
              onClick={() =>
                updateSettings({
                  notificationsEnabled: settings.notificationsEnabled === false ? true : false,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.notificationsEnabled !== false ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound / Chime Toggle */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                {settings.notificationSound !== false ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Gentle Audio Chime
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  ADHD-friendly harmonic bell sound on due time
                </p>
              </div>
            </div>

            <button
              id="toggle-sound-btn"
              onClick={() =>
                updateSettings({
                  notificationSound: settings.notificationSound === false ? true : false,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.notificationSound !== false ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notificationSound !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Browser System Permission Status */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                System Desktop & Mobile Push
              </p>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                {permStatus === 'granted'
                  ? 'System notifications active when tab is backgrounded'
                  : permStatus === 'denied'
                  ? 'Browser notifications blocked (in-app banner will still alert you)'
                  : 'Receive notifications even if app is in background or closed'}
              </p>
            </div>

            {permStatus === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl">
                <Check className="w-3.5 h-3.5" />
                Active
              </span>
            ) : permStatus === 'denied' ? (
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-xl">
                Blocked
              </span>
            ) : (
              <button
                id="enable-browser-notifications-btn"
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                Enable Push
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Firestore & Google Sync */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Cloud Sync & Google Auth</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Backed by Cloud Firestore database with real-time multi-tab & device sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={manualCloudSync}
              disabled={isCloudSyncing}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
              title="Force Sync to Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {user ? `Connected as ${user.displayName || user.email}` : 'Connected (Anonymous Device Cloud Sync)'}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              {isCloudSyncing ? 'Syncing...' : cloudLastSynced ? `Synced at ${cloudLastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Firestore'}
            </span>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2 justify-between">
            {user ? (
              <button
                onClick={logOut}
                className="py-1.5 px-3 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={signInWithGoogle}
                  className="py-2 px-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-300" />
                  Sign in with Google (Cross-Device Sync)
                </button>

                {isIframe && (
                  <button
                    onClick={handleOpenInNewWindow}
                    className="py-2 px-3 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                    title="Open app in a new browser tab to allow full OAuth popups"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in New Window
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Auth Error Banner & Deployed Domain Authorization Guide */}
        {authError && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h3 className="font-bold text-xs">
                  {authError.code === 'auth/unauthorized-domain'
                    ? 'Deployed Domain Needs Firebase Authorization'
                    : authError.code === 'auth/popup-blocked' || authError.code === 'auth/operation-not-supported-in-this-environment'
                    ? 'Popup Blocked (Open App in New Tab)'
                    : 'Sign-In Notice'}
                </h3>
              </div>
              <button
                onClick={clearAuthError}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-0.5 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              {authError.message}
            </p>

            {authError.code === 'auth/unauthorized-domain' && currentHostname && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-amber-200 dark:border-amber-800">
                  <Globe className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="font-mono text-xs text-stone-800 dark:text-stone-200 truncate flex-1 select-all">
                    {currentHostname}
                  </span>
                  <button
                    onClick={handleCopyDomain}
                    className="px-2.5 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    {copiedDomain ? 'Copied!' : 'Copy Domain'}
                  </button>
                </div>

                <div className="text-[11px] text-amber-900 dark:text-amber-200 space-y-1 pl-1">
                  <p className="font-semibold">How to enable Google Sign-In on your deployed app:</p>
                  <ol className="list-decimal list-inside space-y-0.5 opacity-90 pl-1">
                    <li>Open <strong>Firebase Console</strong> and select your project.</li>
                    <li>Go to <strong>Authentication</strong> → <strong>Settings</strong> tab → scroll to <strong>Authorized domains</strong>.</li>
                    <li>Click <strong>Add domain</strong>, paste <code className="font-mono bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded">{currentHostname}</code>, and save.</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="text-[11px] text-amber-800 dark:text-amber-300/90 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
              ✨ <em>Note: Your tasks and notes are saved to Cloud Firestore via Anonymous Device Sync & saved locally, so you will never lose your data!</em>
            </div>
          </div>
        )}
      </div>

      {/* Data Management: Export / Import / Reset */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
          Data & Local Backup
        </h2>
        <p className="text-[11px] text-stone-500">
          Remember stores data securely in your browser and Cloud Firestore. Export anytime to save a backup copy.
        </p>

        {importStatus && (
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 p-2 rounded-xl">
            {importStatus}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Download a complete JSON backup of your tasks and settings"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </motion.button>

          <motion.label 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            title="Upload and restore a previous JSON backup"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </motion.label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (window.confirm('Reset all tasks back to the starter demo tasks and restore default settings?')) {
                resetAllData();
                setImportStatus('Starter template restored.');
                setTimeout(() => setImportStatus(null), 2500);
              }
            }}
            className="py-2.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
            title="Replaces current tasks with the starter sample tasks and default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all tasks? This will wipe your schedule, library, and cloud database completely clean.')) {
                clearAllData();
                setImportStatus('All tasks cleared.');
                setTimeout(() => setImportStatus(null), 2500);
              }
            }}
            className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200/80 dark:border-rose-900/50"
            title="Completely erases all tasks from local storage and cloud database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Data
          </motion.button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES, CategoryMeta } from '../types';
import {
  Sparkles,
  Sliders,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    categories,
    openAddCategoryModal,
    deleteCustomCategory,
    updateSettings,
    resetAllData,
    exportDataJSON,
    importDataJSON,
  } = useTaskContext();

  const [contextInput, setContextInput] = useState(settings.context);
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  const allCategories: Record<string, CategoryMeta> = { ...DEFAULT_CATEGORIES, ...categories };
  const customCategoryKeys = Object.keys(categories).filter(
    (k) => !DEFAULT_CATEGORIES[k as keyof typeof DEFAULT_CATEGORIES]
  );

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 pt-3 pb-24 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Preferences & Context
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Tune your external executive function
        </p>
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

      {/* Subtask Granularity Default (Difficulty Dial) */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">Default Breakdown Granularity</h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Controls how many small steps AI generates for each task (Default: Level 1)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => updateSettings({ difficulty: 1 })}
            className={`p-3 rounded-2xl border text-left transition-all ${
              settings.difficulty === 1
                ? 'bg-teal-50 dark:bg-teal-950 border-teal-600 text-teal-900 dark:text-teal-200 ring-2 ring-teal-600/20'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>Level 1 • Small</span>
              <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-mono">Default</span>
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
              3-4 micro steps. Best for overcoming task paralysis.
            </div>
          </button>

          <button
            onClick={() => updateSettings({ difficulty: 2 })}
            className={`p-3 rounded-2xl border text-left transition-all ${
              settings.difficulty === 2
                ? 'bg-teal-50 dark:bg-teal-950 border-teal-600 text-teal-900 dark:text-teal-200 ring-2 ring-teal-600/20'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <div className="font-bold text-xs">Level 2 • Normal</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
              4-6 steps. Balanced sequential flow.
            </div>
          </button>

          <button
            onClick={() => updateSettings({ difficulty: 3 })}
            className={`p-3 rounded-2xl border text-left transition-all ${
              settings.difficulty === 3
                ? 'bg-teal-50 dark:bg-teal-950 border-teal-600 text-teal-900 dark:text-teal-200 ring-2 ring-teal-600/20'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <div className="font-bold text-xs">Level 3 • Deep</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
              6-8 detailed steps for overwhelming projects.
            </div>
          </button>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm">Task Categories</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Organize your life domains & areas of focus
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddCategoryModal}
            className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {Object.values(allCategories).map((cat) => {
            const isCustom = Boolean(customCategoryKeys.includes(cat.id));
            return (
              <div
                key={cat.id}
                className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.dotColor }}
                  />
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {cat.label}
                  </span>
                </div>

                {isCustom && (
                  <button
                    type="button"
                    onClick={() => deleteCustomCategory(cat.id)}
                    className="text-stone-400 hover:text-rose-500 p-1 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
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

      {/* AI & Executive Engine Status */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-teal-700 dark:text-teal-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
            Gemini 2.5 AI & Offline Heuristics Active
          </p>
          <p className="text-[11px] text-stone-500">
            Powered by server-side Gemini AI with instant rule-based offline fallbacks.
          </p>
        </div>
      </div>

      {/* Data Management: Export / Import / Reset */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
          Data & Local Backup
        </h2>
        <p className="text-[11px] text-stone-500">
          Remember stores data securely in your browser. Export anytime to save a copy.
        </p>

        {importStatus && (
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 p-2 rounded-xl">
            {importStatus}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={handleExport}
            className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <label className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Reset all tasks back to starter examples?')) {
                resetAllData();
              }
            }}
            className="py-2.5 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

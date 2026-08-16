import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import {
  Brain,
  Sparkles,
  X,
  Check,
  Zap,
  Activity,
  User,
  Lightbulb,
} from 'lucide-react';

const CONTEXT_PRESETS = [
  {
    label: 'ADHD Micro-Steps',
    emoji: '⚡',
    text: 'I have ADHD and struggle with task paralysis. Break tasks down into ultra-clear, low-friction micro-steps under 15 minutes each. Keep action verbs very clear and concrete.',
  },
  {
    label: 'Executive Coach',
    emoji: '🎯',
    text: 'Act as an empathetic executive dysfunction coach. Help me prioritize the single next step, reduce cognitive overwhelm, and encourage momentum over perfection.',
  },
  {
    label: 'Student / Academic',
    emoji: '📚',
    text: 'I am a student balancing coursework, readings, thesis writing, and exams. Help me estimate realistic study blocks and break down long research papers.',
  },
  {
    label: 'Work & Deep Focus',
    emoji: '💼',
    text: 'I work in a fast-paced environment with context switching. Break complex projects into distinct phases, meetings, and deep-work sprints.',
  },
  {
    label: 'Gentle Pacing',
    emoji: '🌱',
    text: 'I am recovering from burnout. Focus on low-demand pacing, celebrating small wins, building daily routine consistency, and avoiding exhausting work blocks.',
  },
];

export const AiContextModal: React.FC = () => {
  const { isAiContextOpen, closeAiContext, settings, updateSettings, testAiConnection } =
    useTaskContext();

  const [contextText, setContextText] = useState(settings.context || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    model?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isAiContextOpen) {
      setContextText(settings.context || '');
      setIsSaved(false);
      setTestResult(null);
    }
  }, [isAiContextOpen, settings.context]);

  if (!isAiContextOpen) return null;

  const handleSave = () => {
    updateSettings({ context: contextText.trim() });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      closeAiContext();
    }, 800);
  };

  const handleAppendPreset = (presetText: string) => {
    setContextText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetText;
      if (trimmed.includes(presetText)) return trimmed;
      return `${trimmed}\n\n${presetText}`;
    });
  };

  const handleTestAi = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message || 'Connection check failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAiContext}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 z-10 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-300/40 dark:border-amber-700/40 shadow-xs">
                <Brain className="w-5 h-5 stroke-[2.2px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 leading-none">
                    AI Brain Context
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Active
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Injected into every Gemini breakdown and task breakdown call
                </p>
              </div>
            </div>

            <button
              onClick={closeAiContext}
              aria-label="Close AI Context modal"
              className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Quick Presets */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>ADHD & Style Presets (Tap to Add)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAppendPreset(preset.text)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-amber-50 hover:text-amber-900 dark:hover:bg-amber-950/50 dark:hover:text-amber-200 border border-stone-200/60 dark:border-stone-700/60 hover:border-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Your Personal Life & Working Context
                </label>
                <span className="text-[11px] font-mono text-stone-400">
                  {contextText.length} chars
                </span>
              </div>
              <textarea
                rows={5}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="e.g., I have ADHD and struggle with starting big tasks. Break things into steps under 15 minutes, focus on concrete action verbs, and help me stay calm..."
                className="w-full p-3.5 text-xs leading-relaxed rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-sans"
              />
            </div>

            {/* AI Diagnostics / Live Test */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Gemini Live Model Link
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    {testResult
                      ? testResult.ok
                        ? `Connected (${testResult.model || 'gemini-2.5-flash'} • ${testResult.latencyMs}ms)`
                        : `Offline fallback ready (${testResult.error})`
                      : 'Server-side Gemini 2.5 Flash'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestAi}
                disabled={isTesting}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1"
              >
                <Zap className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-500' : 'text-amber-500'}`} />
                <span>{isTesting ? 'Testing...' : 'Test AI'}</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={closeAiContext}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950 active:scale-98'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved Context!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save AI Context</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

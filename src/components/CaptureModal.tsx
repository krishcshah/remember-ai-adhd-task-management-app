import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES, TaskCategory, RepeatType, CategoryMeta } from '../types';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Check,
  Plus,
  Trash2,
  Layers,
  Repeat,
} from 'lucide-react';
import { getTodayDateString } from '../utils/storage';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export const CaptureModal: React.FC = () => {
  const {
    isCaptureOpen,
    closeCapture,
    captureInitialTab,
    categories,
    openAddCategoryModal,
    addTask,
    addMultipleTasks,
    requestBreakdown,
    requestBrainDump,
    settings,
    aiLoading,
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState<'quick' | 'braindump'>(captureInitialTab);

  // Quick Add State - default difficulty set to 1 (Small / Bite-sized)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [scheduledDate, setScheduledDate] = useState<string | null>(getTodayDateString());
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(settings.difficulty || 1);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; estMinutes: number }[]>([]);
  const [estTotalMinutes, setEstTotalMinutes] = useState<number>(15);

  // Brain Dump State
  const [brainDumpText, setBrainDumpText] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<
    Array<{
      title: string;
      category: TaskCategory;
      estimatedMinutes: number;
      subtasks?: { title: string; estimatedMinutes: number }[];
    }>
  >([]);

  useEffect(() => {
    setActiveTab(captureInitialTab);
  }, [captureInitialTab]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isCaptureOpen) {
      setTitle('');
      setCategory('work');
      setScheduledDate(getTodayDateString());
      setScheduledTime('');
      setRepeatType('none');
      setRepeatDays([]);
      setNotes('');
      setDifficulty(settings.difficulty || 1);
      setSubtasks([]);
      setEstTotalMinutes(15);
      setBrainDumpText('');
      setExtractedTasks([]);
    }
  }, [isCaptureOpen, settings.difficulty]);

  if (!isCaptureOpen) return null;

  const toggleRepeatDay = (dayId: number) => {
    setRepeatDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  // Run AI Magic Breakdown for quick add
  const handleGenerateMagicSubtasks = async () => {
    if (!title.trim()) return;
    try {
      const res = await requestBreakdown(title, difficulty, notes, category);
      setCategory(res.category);
      setEstTotalMinutes(res.estimatedMinutes);
      setSubtasks(
        res.subtasks.map((s, idx) => ({
          id: `new-sub-${Date.now()}-${idx}`,
          title: s.title,
          estMinutes: s.estimatedMinutes,
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Run AI Brain Dump Extraction
  const handleExtractBrainDump = async () => {
    if (!brainDumpText.trim()) return;
    try {
      const extracted = await requestBrainDump(brainDumpText);
      setExtractedTasks(extracted);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Quick Add Task
  const handleSaveQuickTask = () => {
    if (!title.trim()) return;

    const isDaily = repeatType === 'daily';

    addTask({
      title: title.trim(),
      category,
      estMinutes: estTotalMinutes || 15,
      scheduledDate: isDaily ? (scheduledDate || getTodayDateString()) : scheduledDate,
      scheduledTime: scheduledTime.trim() || null,
      repeatDaily: isDaily,
      repeatType,
      repeatDays: repeatType === 'weekly_on' ? repeatDays : undefined,
      status: 'todo',
      notes: notes.trim() || undefined,
      subtasks: subtasks.map((s) => ({
        id: s.id,
        title: s.title,
        estMinutes: s.estMinutes,
        done: false,
      })),
    });

    closeCapture();
  };

  // Save Extracted Brain Dump tasks
  const handleSaveExtractedTasks = (targetDate: string | null) => {
    if (extractedTasks.length === 0) return;

    const payload = extractedTasks.map((t, idx) => ({
      title: t.title,
      category: t.category,
      estMinutes: t.estimatedMinutes,
      scheduledDate: targetDate,
      scheduledTime: null,
      status: 'todo' as const,
      subtasks: (t.subtasks || []).map((st, sidx) => ({
        id: `b-sub-${Date.now()}-${idx}-${sidx}`,
        title: st.title,
        estMinutes: st.estimatedMinutes,
        done: false,
      })),
    }));

    addMultipleTasks(payload);
    closeCapture();
  };

  const allCategories: Record<string, CategoryMeta> = { ...DEFAULT_CATEGORIES, ...categories };

  return (
    <div className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200/80 dark:border-stone-800 animate-slideUp overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'quick'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Quick Add
            </button>
            <button
              onClick={() => setActiveTab('braindump')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'braindump'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Brain Dump
            </button>
          </div>

          <button
            onClick={closeCapture}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'quick' ? (
            /* QUICK ADD FORM */
            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Clean kitchen counter, take vitamins, draft report..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && subtasks.length === 0) handleGenerateMagicSubtasks();
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                />
              </div>

              {/* Repeat Options */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                    <Repeat className="w-3.5 h-3.5" />
                  </div>
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Repeat Pattern
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRepeatType('none')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      repeatType === 'none'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType('daily')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      repeatType === 'daily'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType('weekly')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      repeatType === 'weekly'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType('weekly_on')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      repeatType === 'weekly_on'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Weekly on...
                  </button>
                </div>

                {repeatType === 'weekly_on' && (
                  <div className="grid grid-cols-7 gap-1 pt-1">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = repeatDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleRepeatDay(d.id)}
                          className={`h-8 rounded-xl text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-teal-800 text-white'
                              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category selector with + Add Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={openAddCategoryModal}
                    className="text-xs font-semibold text-teal-800 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Category
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(allCategories).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        category === cat.id
                          ? `${cat.bgLight} ${cat.bgDark} ${cat.borderColor} ${cat.textColor} ring-2 ring-teal-600/20`
                          : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.dotColor }} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                {repeatType !== 'daily' ? (
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                      When?
                    </label>
                    <select
                      value={scheduledDate || 'unscheduled'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setScheduledDate(val === 'unscheduled' ? null : val);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none"
                    >
                      <option value={getTodayDateString()}>Today</option>
                      <option
                        value={
                          new Date(Date.now() + 86400000).toISOString().split('T')[0]
                        }
                      >
                        Tomorrow
                      </option>
                      <option value="unscheduled">Unscheduled (Inbox)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                    {repeatType !== 'daily' ? 'Time (Optional)' : 'Active Date'}
                  </label>
                  {repeatType !== 'daily' ? (
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200"
                    />
                  ) : (
                    <input
                      type="date"
                      value={scheduledDate || getTodayDateString()}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200"
                    />
                  )}
                </div>
              </div>

              {/* Subtask Granularity Default: Level 1 Small */}
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Subtask Granularity (Default: Small)
                </label>
                <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setDifficulty(1)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      difficulty === 1
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    1 Small (3-4 micro steps)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty(2)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      difficulty === 2
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    2 Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty(3)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      difficulty === 3
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    3 Deep
                  </button>
                </div>
              </div>

              {/* Magic AI Breakdown Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGenerateMagicSubtasks}
                  disabled={aiLoading || !title.trim()}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-stone-950 font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {aiLoading
                      ? 'AI is breaking down steps...'
                      : subtasks.length > 0
                      ? 'Regenerate Small Steps'
                      : 'Generate Bite-Sized Steps with AI'}
                  </span>
                </button>
              </div>

              {/* Subtasks Preview List */}
              {subtasks.length > 0 && (
                <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                    <span>Generated Micro-Steps ({subtasks.length})</span>
                    <span className="font-mono text-stone-500">~{estTotalMinutes} min total</span>
                  </div>

                  <div className="space-y-2">
                    {subtasks.map((st, i) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-500 flex items-center justify-center font-mono shrink-0">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubtasks((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, title: val } : item))
                            );
                          }}
                          className="flex-1 bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-stone-400">
                          {st.estMinutes}m
                        </span>
                        <button
                          type="button"
                          onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-stone-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSubtasks((prev) => [
                        ...prev,
                        { id: `man-${Date.now()}`, title: 'New step', estMinutes: 5 },
                      ])
                    }
                    className="text-xs text-teal-800 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add another step
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* BRAIN DUMP TAB */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Unload everything in your head
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste or write whatever thoughts are buzzing in your head:
- Need to email the tax advisor
- Buy groceries (oat milk, eggs, apples)
- Schedule car oil change
- Maya's birthday gift brainstorm..."
                  value={brainDumpText}
                  onChange={(e) => setBrainDumpText(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleExtractBrainDump}
                disabled={aiLoading || !brainDumpText.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-stone-950 font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {aiLoading ? 'AI is sorting & organizing...' : 'Organize into Tasks with AI'}
                </span>
              </button>

              {/* Extracted Tasks Preview */}
              {extractedTasks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Discovered {extractedTasks.length} Actionable Tasks
                    </span>
                    <span className="text-[11px] text-stone-400">Review & Save</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {extractedTasks.map((t, idx) => {
                      const meta = allCategories[t.category] || allCategories.other || DEFAULT_CATEGORIES.other;
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${meta.bgLight} ${meta.bgDark} ${meta.textColor}`}
                              >
                                {meta.label}
                              </span>
                              <span className="text-[10px] font-mono text-stone-500">
                                ~{t.estimatedMinutes}m
                              </span>
                              {t.subtasks && (
                                <span className="text-[10px] text-stone-400">
                                  {t.subtasks.length} steps
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExtractedTasks((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-stone-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveExtractedTasks(getTodayDateString())}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-teal-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      Add to Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveExtractedTasks(null)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-4 h-4" />
                      Add to Inbox
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer for Quick Add */}
        {activeTab === 'quick' && (
          <div className="p-4 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-end gap-3 bg-stone-50/50 dark:bg-stone-900/50">
            <button
              type="button"
              onClick={closeCapture}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveQuickTask}
              disabled={!title.trim()}
              className="py-2.5 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-amber-300 font-display font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3px]" />
              <span>Save Task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

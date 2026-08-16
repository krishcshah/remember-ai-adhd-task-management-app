import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { detectScheduledDateAndTime } from '../utils/aiFallback';

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

  // Quick Add State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [scheduledDate, setScheduledDate] = useState<string | null>(getTodayDateString());
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; estMinutes: number }[]>([]);
  const [estTotalMinutes, setEstTotalMinutes] = useState<number>(15);
  const [manualStepText, setManualStepText] = useState('');
  const [manualStepMins, setManualStepMins] = useState<number>(5);
  const [aiEnhancedNotice, setAiEnhancedNotice] = useState<string | null>(null);

  // Brain Dump State
  const [brainDumpText, setBrainDumpText] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<
    Array<{
      title: string;
      category: TaskCategory;
      scheduledDate?: string | null;
      scheduledTime?: string | null;
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
      setSubtasks([]);
      setEstTotalMinutes(15);
      setManualStepText('');
      setManualStepMins(5);
      setAiEnhancedNotice(null);
      setBrainDumpText('');
      setExtractedTasks([]);
    }
  }, [isCaptureOpen]);

  const toggleRepeatDay = (dayId: number) => {
    setRepeatDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  // Add manual subtask step
  const handleAddManualSubtask = () => {
    const text = manualStepText.trim();
    if (!text) return;
    const mins = Math.max(1, Number(manualStepMins) || 5);
    const newStep = {
      id: `man-sub-${Date.now()}-${subtasks.length}`,
      title: text,
      estMinutes: mins,
    };
    const nextList = [...subtasks, newStep];
    setSubtasks(nextList);
    const total = nextList.reduce((sum, s) => sum + s.estMinutes, 0);
    if (total > 0) setEstTotalMinutes(total);
    setManualStepText('');
  };

  const handleRemoveSubtask = (indexToRemove: number) => {
    const nextList = subtasks.filter((_, idx) => idx !== indexToRemove);
    setSubtasks(nextList);
    const total = nextList.reduce((sum, s) => sum + s.estMinutes, 0);
    setEstTotalMinutes(total > 0 ? total : 15);
  };

  const handleUpdateSubtaskMinutes = (index: number, minutes: number) => {
    const mins = Math.max(1, minutes);
    const nextList = subtasks.map((st, idx) => (idx === index ? { ...st, estMinutes: mins } : st));
    setSubtasks(nextList);
    const total = nextList.reduce((sum, s) => sum + s.estMinutes, 0);
    if (total > 0) setEstTotalMinutes(total);
  };

  // Direct Save (Instant 0ms save without waiting for AI)
  const handleDirectSave = () => {
    if (!title.trim()) return;
    
    // Quick heuristic date check from title
    const { scheduledDate: detectedDate, scheduledTime: detectedTime, cleanedText } = detectScheduledDateAndTime(title.trim(), getTodayDateString());
    const cleanTitle = cleanedText || title.trim();
    const isDaily = repeatType === 'daily';
    const finalDate = detectedDate !== null ? detectedDate : (isDaily ? (scheduledDate || getTodayDateString()) : scheduledDate);
    const finalTime = (detectedTime || scheduledTime).trim() || null;

    addTask({
      title: cleanTitle,
      category,
      estMinutes: estTotalMinutes || 15,
      scheduledDate: finalDate,
      scheduledTime: finalTime,
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

  // Magic Save: runs fast AI breakdown then immediately saves
  const [isMagicSaving, setIsMagicSaving] = useState(false);

  const handleMagicSave = async () => {
    if (!title.trim() || isMagicSaving) return;
    setIsMagicSaving(true);

    let finalTitle = title.trim();
    let finalCategory = category;
    let finalEstMinutes = estTotalMinutes || 15;
    let finalRepeatType = repeatType;
    let finalRepeatDays = repeatDays;
    let finalSubtasks = subtasks;
    let finalScheduledDate = scheduledDate;
    let finalScheduledTime = scheduledTime.trim() || null;

    try {
      const existingSubs = subtasks
        .filter((s) => s.title && s.title.trim() && s.title !== 'undefined')
        .map((s) => ({ title: s.title.trim(), estimatedMinutes: s.estMinutes }));

      // Race with 3.5s timeout for ultra fast executive response
      const aiPromise = requestBreakdown(title, undefined, notes, category, existingSubs);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));

      const res = await Promise.race([aiPromise, timeoutPromise]);

      if (res) {
        if (res.title) finalTitle = res.title;
        if (res.category) finalCategory = res.category;
        if (res.estimatedMinutes) finalEstMinutes = res.estimatedMinutes;
        if (res.scheduledDate !== undefined && res.scheduledDate !== null) {
          finalScheduledDate = res.scheduledDate;
        }
        if (res.scheduledTime !== undefined && res.scheduledTime !== null) {
          finalScheduledTime = res.scheduledTime;
        }
        if (res.repeatType) {
          finalRepeatType = res.repeatType;
          if (res.repeatType === 'weekly_on' && Array.isArray(res.repeatDays) && res.repeatDays.length > 0) {
            finalRepeatDays = res.repeatDays;
          }
        }

        // If user had not already manually created steps, use the AI generated subtasks
        if (existingSubs.length === 0 && res.subtasks && res.subtasks.length > 0) {
          finalSubtasks = res.subtasks.map((s, idx) => ({
            id: `new-sub-${Date.now()}-${idx}`,
            title: s.title,
            estMinutes: s.estimatedMinutes,
          }));
        }
      } else {
        // AI timed out - fallback to local heuristic date parser
        const { scheduledDate: fallbackDate, scheduledTime: fallbackTime, cleanedText } = detectScheduledDateAndTime(title, getTodayDateString());
        if (fallbackDate) finalScheduledDate = fallbackDate;
        if (fallbackTime) finalScheduledTime = fallbackTime;
        if (cleanedText) finalTitle = cleanedText;
      }
    } catch (err) {
      console.warn('AI breakdown fell back gracefully on save:', err);
      const { scheduledDate: fallbackDate, scheduledTime: fallbackTime, cleanedText } = detectScheduledDateAndTime(title, getTodayDateString());
      if (fallbackDate) finalScheduledDate = fallbackDate;
      if (fallbackTime) finalScheduledTime = fallbackTime;
      if (cleanedText) finalTitle = cleanedText;
    }

    const isDaily = finalRepeatType === 'daily';

    addTask({
      title: finalTitle,
      category: finalCategory,
      estMinutes: finalEstMinutes,
      scheduledDate: isDaily ? (finalScheduledDate || getTodayDateString()) : finalScheduledDate,
      scheduledTime: finalScheduledTime,
      repeatDaily: isDaily,
      repeatType: finalRepeatType,
      repeatDays: finalRepeatType === 'weekly_on' ? finalRepeatDays : undefined,
      status: 'todo',
      notes: notes.trim() || undefined,
      subtasks: finalSubtasks.map((s) => ({
        id: s.id,
        title: s.title,
        estMinutes: s.estMinutes,
        done: false,
      })),
    });

    setIsMagicSaving(false);
    closeCapture();
  };

  const [brainDumpError, setBrainDumpError] = useState<string | null>(null);

  // Run AI Brain Dump Extraction
  const handleExtractBrainDump = async () => {
    const raw = brainDumpText.trim();
    if (!raw) return;
    setBrainDumpError(null);
    try {
      const extracted = await requestBrainDump(raw);
      if (Array.isArray(extracted) && extracted.length > 0) {
        setExtractedTasks(extracted);
      } else {
        setBrainDumpError('Could not find actionable items. Try adding bullet points or new lines.');
      }
    } catch (e: any) {
      console.error('Brain dump error:', e);
      setBrainDumpError(e?.message || 'Failed to extract tasks. Please try again.');
    }
  };

  // Save Extracted Brain Dump tasks
  const handleSaveExtractedTasks = (targetDate: string | null) => {
    if (!extractedTasks || extractedTasks.length === 0) return;

    const now = Date.now();
    const payload = extractedTasks
      .filter((t) => t && typeof t === 'object' && String(t.title || '').trim().length > 0)
      .map((t, idx) => ({
        title: String(t.title).trim(),
        category: (t.category as TaskCategory) || 'other',
        estMinutes: Math.max(1, Number(t.estimatedMinutes) || 15),
        scheduledDate: t.scheduledDate !== undefined && t.scheduledDate !== null ? t.scheduledDate : targetDate,
        scheduledTime: t.scheduledTime || null,
        status: 'todo' as const,
        subtasks: Array.isArray(t.subtasks)
          ? t.subtasks.map((st, sidx) => ({
              id: `b-sub-${now}-${idx}-${sidx}`,
              title: String(st?.title || `Step ${sidx + 1}`),
              estMinutes: Math.max(1, Number(st?.estimatedMinutes) || 5),
              done: false,
            }))
          : [],
      }));

    if (payload.length > 0) {
      addMultipleTasks(payload);
    }
    closeCapture();
  };

  const allCategories: Record<string, CategoryMeta> = { ...DEFAULT_CATEGORIES, ...categories };

  return (
    <AnimatePresence>
      {isCaptureOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={closeCapture}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.96 }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 400,
              mass: 0.8,
            }}
            className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden relative z-10"
          >
            {/* Modal Top Bar */}
            <div className="p-4 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('quick')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'quick'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Quick Add
                </button>
                <button
                  onClick={() => setActiveTab('braindump')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'braindump'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Brain Dump
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeCapture}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
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
                    if (e.key === 'Enter') handleMagicSave();
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
                      value={!scheduledDate ? 'unscheduled' : scheduledDate === getTodayDateString() ? 'today' : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'today') {
                          setScheduledDate(getTodayDateString());
                        } else if (val === 'unscheduled') {
                          setScheduledDate(null);
                        } else if (val === 'custom') {
                          if (!scheduledDate || scheduledDate === getTodayDateString()) {
                            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                            setScheduledDate(tomorrow);
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none"
                    >
                      <option value="today">Today</option>
                      <option value="custom">Select date</option>
                      <option value="unscheduled">Unschedule</option>
                    </select>

                    {Boolean(scheduledDate && scheduledDate !== getTodayDateString()) && (
                      <div className="mt-2">
                        <input
                          type="date"
                          value={scheduledDate || ''}
                          onChange={(e) => setScheduledDate(e.target.value || null)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                        />
                      </div>
                    )}
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

              {/* Micro-Steps & Subtasks Management */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        Micro-Steps & Subtasks
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        {subtasks.length === 0
                          ? 'Add steps manually or use AI Magic'
                          : `${subtasks.length} step${subtasks.length === 1 ? '' : 's'} • ~${estTotalMinutes} min total`}
                      </p>
                    </div>
                  </div>

                  {subtasks.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span className="text-[11px] font-mono font-semibold text-stone-700 dark:text-stone-300">
                        ~{estTotalMinutes}m
                      </span>
                    </div>
                  )}
                </div>

                {/* Manual Subtask Quick Add Bar */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                    Add Step Manually:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Gather notes, open document, send email..."
                      value={manualStepText}
                      onChange={(e) => setManualStepText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualSubtask();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                    
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-2 py-1.5 rounded-xl">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={manualStepMins}
                        onChange={(e) => setManualStepMins(Math.max(1, parseInt(e.target.value) || 5))}
                        className="w-8 text-center text-xs font-mono bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none"
                      />
                      <span className="text-[10px] font-mono text-stone-400">m</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddManualSubtask}
                      disabled={!manualStepText.trim()}
                      title="Add Step"
                      aria-label="Add Step"
                      className="w-8 h-8 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold flex items-center justify-center shadow-xs transition-all disabled:opacity-40 disabled:hover:bg-teal-800 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks List */}
                {subtasks.length > 0 ? (
                  <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/60 space-y-2">
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {subtasks.map((st, i) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-600 dark:text-stone-400 flex items-center justify-center font-mono shrink-0">
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
                          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-800 px-1.5 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={st.estMinutes}
                              onChange={(e) =>
                                handleUpdateSubtaskMinutes(i, parseInt(e.target.value) || 5)
                              }
                              className="w-7 text-center text-[11px] font-mono bg-transparent text-stone-700 dark:text-stone-300 focus:outline-none"
                            />
                            <span className="text-[10px] font-mono text-stone-400">m</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(i)}
                            className="text-stone-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                            title="Delete step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newStep = {
                          id: `man-sub-${Date.now()}-${subtasks.length}`,
                          title: `Action step ${subtasks.length + 1}`,
                          estMinutes: 5,
                        };
                        const nextList = [...subtasks, newStep];
                        setSubtasks(nextList);
                        const total = nextList.reduce((sum, s) => sum + s.estMinutes, 0);
                        if (total > 0) setEstTotalMinutes(total);
                      }}
                      className="text-xs text-teal-800 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another step
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 italic text-center py-1">
                    No steps added yet. Type a step above or click AI Magic.
                  </p>
                )}
              </div>
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

              {brainDumpError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
                  {brainDumpError}
                </div>
              )}

              <button
                type="button"
                onClick={handleExtractBrainDump}
                disabled={aiLoading || !brainDumpText.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-stone-950 font-display font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
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
              <div className="p-4 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50">
                <button
                  type="button"
                  onClick={closeCapture}
                  className="px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={handleDirectSave}
                    disabled={!title.trim() || isMagicSaving}
                    className="py-2 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Save Directly
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={handleMagicSave}
                    disabled={!title.trim() || isMagicSaving}
                    className="py-2 px-5 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isMagicSaving ? 'animate-spin' : ''}`} />
                    <span>{isMagicSaving ? 'Enriching...' : 'Magic Save'}</span>
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

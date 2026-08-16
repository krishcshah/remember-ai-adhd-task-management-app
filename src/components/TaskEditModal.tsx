import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Subtask, RepeatType, CATEGORIES, getCategoryInfo } from '../types';
import {
  X,
  Sparkles,
  Trash2,
  Plus,
  Clock,
  Calendar,
  Check,
  Wand2,
  Play,
  Repeat,
  Scissors,
  Zap,
  MessageSquareText,
} from 'lucide-react';
import { getTodayDateString } from '../utils/storage';
import { normalizeAiSubtasks } from '../utils/aiFallback';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export const TaskEditModal: React.FC = () => {
  const {
    isEditOpen,
    closeEdit,
    editingTask,
    updateTask,
    deleteTask,
    startFocus,
    requestChatEdit,
    requestBreakdown,
    aiLoading,
  } = useTaskContext();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [estMinutes, setEstMinutes] = useState<number>(20);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategory(editingTask.category || 'other');
      setScheduledDate(editingTask.scheduledDate);
      setScheduledTime(editingTask.scheduledTime || '');
      if (editingTask.repeatType) {
        setRepeatType(editingTask.repeatType);
        setRepeatDays(editingTask.repeatDays || []);
      } else if (editingTask.repeatDaily) {
        setRepeatType('daily');
        setRepeatDays([]);
      } else {
        setRepeatType('none');
        setRepeatDays([]);
      }
      setNotes(editingTask.notes || '');
      setEstMinutes(editingTask.estMinutes);
      const initialSubs = (editingTask.subtasks || []).map((s: any, idx: number) => {
        const rawTitle = typeof s === 'string' ? s : (s?.title || s?.text || s?.name || s?.step || s?.subtask || '');
        const cleanTitle = String(rawTitle || '').trim();
        return {
          id: s?.id || `sub-${Date.now()}-${idx}`,
          title: cleanTitle && cleanTitle !== 'undefined' ? cleanTitle : `Action step ${idx + 1}`,
          estMinutes: Number(s?.estMinutes || s?.estimatedMinutes || 5) || 5,
          done: Boolean(s?.done),
        };
      });
      setSubtasks(initialSubs);
      setAiNotice(null);
    }
  }, [editingTask]);

  const toggleRepeatDay = (dayId: number) => {
    setRepeatDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const [isMagicSaving, setIsMagicSaving] = useState(false);

  const handleMagicSave = async () => {
    if (!editingTask || !title.trim() || isMagicSaving) return;

    const cleanTitle = title.trim();
    const cleanNotes = notes.trim();
    const isDaily = repeatType === 'daily';
    const cleanDate = isDaily ? (scheduledDate || getTodayDateString()) : scheduledDate;
    const cleanTime = scheduledTime.trim() || null;
    const cleanRepeatDays = repeatType === 'weekly_on' ? repeatDays : undefined;

    // Original values from task prior to edits
    const origTitle = (editingTask.title || '').trim();
    const origNotes = (editingTask.notes || '').trim();
    const origSubtasks = (editingTask.subtasks || []).map((s: any) => ({
      title: String(typeof s === 'string' ? s : (s?.title || s?.text || s?.name || '')).trim(),
      estMinutes: Number(s?.estMinutes || s?.estimatedMinutes || 5) || 5,
    }));

    // Current subtasks from state
    const currentSubtasks = subtasks
      .map((s) => ({
        id: s.id,
        title: String(s.title || '').trim(),
        estMinutes: Number(s.estMinutes) || 5,
        done: Boolean(s.done),
      }))
      .filter((s) => s.title.length > 0 && s.title !== 'undefined');

    // 1. Detect if any TEXT field was modified (Title, Notes, or any Subtask title line item added/edited/removed)
    // Non-text changes (date, time, repeat, category, estMinutes, done) MUST NOT trigger AI re-run!
    const isTitleChanged = cleanTitle !== origTitle;
    const isNotesChanged = cleanNotes !== origNotes;
    const isSubtaskCountChanged = currentSubtasks.length !== origSubtasks.length;
    const areSubtaskTitlesChanged =
      isSubtaskCountChanged ||
      currentSubtasks.some((st, i) => {
        const orig = origSubtasks[i];
        return !orig || st.title !== orig.title;
      });

    const hasTextChanged = isTitleChanged || isNotesChanged || areSubtaskTitlesChanged;

    // If NO text was modified (e.g. user only altered date, time, repeat frequency, category, or subtask minutes),
    // perform direct instant save without AI latency or unwanted overwrites
    if (!hasTextChanged) {
      updateTask(editingTask.id, {
        title: cleanTitle,
        category: category || 'other',
        scheduledDate: cleanDate,
        scheduledTime: cleanTime,
        repeatDaily: isDaily,
        repeatType: repeatType,
        repeatDays: cleanRepeatDays,
        notes: cleanNotes || undefined,
        estMinutes: estMinutes || 20,
        subtasks: currentSubtasks.map((s, idx) => ({
          id: s.id || `sub-${Date.now()}-${idx}`,
          title: s.title,
          estMinutes: s.estMinutes,
          done: s.done,
        })),
      });

      closeEdit();
      return;
    }

    // 2. TEXT WAS MODIFIED: Trigger AI breakdown/polish to rewrite/fix spelling & polish modified text lines
    setIsMagicSaving(true);

    let finalTitle = cleanTitle;
    let finalEstMinutes = estMinutes || 20;
    let finalRepeatType = repeatType;
    let finalRepeatDays = repeatDays;
    let finalScheduledDate = cleanDate;
    let finalScheduledTime = cleanTime;
    let finalSubtasks = currentSubtasks;
    let finalCategory = category || 'other';

    try {
      // Pass the current subtask list (with the user's updated text) as existing steps for AI context
      const existingSubsForAi = currentSubtasks.map((s) => ({
        title: s.title,
        estimatedMinutes: s.estMinutes,
      }));

      const res = await requestBreakdown(
        finalTitle,
        undefined,
        cleanNotes || undefined,
        finalCategory,
        existingSubsForAi.length > 0 ? existingSubsForAi : undefined
      );

      if (res) {
        if (res.title && typeof res.title === 'string' && res.title.trim()) {
          finalTitle = res.title.trim();
        }

        // Apply AI refined/polished subtasks
        if (res.subtasks && Array.isArray(res.subtasks) && res.subtasks.length > 0) {
          const normalized = normalizeAiSubtasks(res.subtasks, finalTitle);
          if (normalized.length > 0) {
            finalSubtasks = normalized.map((s, idx) => {
              const wasDone = Boolean(currentSubtasks[idx]?.done);
              return {
                id: currentSubtasks[idx]?.id || `edit-sub-${Date.now()}-${idx}`,
                title: s.title,
                estMinutes: s.estimatedMinutes || 5,
                done: wasDone,
              };
            });
          }
        }

        if (res.estimatedMinutes && Number(res.estimatedMinutes) > 0) {
          finalEstMinutes = Number(res.estimatedMinutes);
        } else if (finalSubtasks.length > 0) {
          finalEstMinutes = finalSubtasks.reduce((sum, s) => sum + s.estMinutes, 0);
        }

        // Keep the user's manually set date/time/repeat unless not set
        const userExplicitlyChangedDate = scheduledDate !== editingTask.scheduledDate;
        const userExplicitlyChangedTime = (scheduledTime || '') !== (editingTask.scheduledTime || '');
        const origRepeat = editingTask.repeatType || (editingTask.repeatDaily ? 'daily' : 'none');
        const userExplicitlyChangedRepeat = repeatType !== origRepeat;

        if (!userExplicitlyChangedDate && res.scheduledDate !== undefined && res.scheduledDate !== null) {
          finalScheduledDate = res.scheduledDate;
        }
        if (!userExplicitlyChangedTime && res.scheduledTime !== undefined && res.scheduledTime !== null) {
          finalScheduledTime = res.scheduledTime;
        }
        if (!userExplicitlyChangedRepeat && res.repeatType) {
          finalRepeatType = res.repeatType;
          if (res.repeatType === 'weekly_on' && Array.isArray(res.repeatDays) && res.repeatDays.length > 0) {
            finalRepeatDays = res.repeatDays;
          }
        }
      }
    } catch (err) {
      console.warn('AI breakdown in EditModal failed, falling back:', err);
    } finally {
      setIsMagicSaving(false);
    }

    const isFinalDaily = finalRepeatType === 'daily';

    updateTask(editingTask.id, {
      title: finalTitle,
      category: finalCategory,
      scheduledDate: isFinalDaily ? (finalScheduledDate || getTodayDateString()) : finalScheduledDate,
      scheduledTime: finalScheduledTime,
      repeatDaily: isFinalDaily,
      repeatType: finalRepeatType,
      repeatDays: finalRepeatType === 'weekly_on' ? finalRepeatDays : undefined,
      notes: cleanNotes || undefined,
      estMinutes: finalEstMinutes,
      subtasks: finalSubtasks.map((s, idx) => ({
        id: s.id || `sub-${Date.now()}-${idx}`,
        title: s.title && s.title !== 'undefined' ? s.title : `Action step ${idx + 1}`,
        estMinutes: Number(s.estMinutes) || 5,
        done: Boolean(s.done),
      })),
    });

    closeEdit();
  };

  const handleDelete = () => {
    if (!editingTask) return;
    deleteTask(editingTask.id);
    closeEdit();
  };

  const handleAddSubtask = () => {
    setSubtasks((prev) => [
      ...prev,
      {
        id: `manual-sub-${Date.now()}`,
        title: 'New action step',
        estMinutes: 5,
        done: false,
      },
    ]);
  };

  return (
    <AnimatePresence>
      {isEditOpen && editingTask && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={closeEdit}
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
            {/* Header */}
            <div className="p-4 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Edit Task</span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {editingTask.id.slice(0, 10)}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    closeEdit();
                    startFocus(editingTask);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-1 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Focus
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeEdit}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* AI Banner feedback notice */}
          {aiNotice && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                {aiNotice}
              </span>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="text-amber-700 dark:text-amber-300 hover:opacity-75 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-teal-800 dark:bg-teal-700 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700/60'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Schedule Section */}
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
                    ? 'bg-teal-800 dark:bg-teal-700 text-white border-teal-800 dark:border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setRepeatType('daily')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  repeatType === 'daily'
                    ? 'bg-teal-800 dark:bg-teal-700 text-white border-teal-800 dark:border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setRepeatType('weekly')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  repeatType === 'weekly'
                    ? 'bg-teal-800 dark:bg-teal-700 text-white border-teal-800 dark:border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setRepeatType('weekly_on')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  repeatType === 'weekly_on'
                    ? 'bg-teal-800 dark:bg-teal-700 text-white border-teal-800 dark:border-teal-600 shadow-xs'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
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
                          ? 'bg-teal-800 dark:bg-teal-700 text-white'
                          : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
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
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Time (Optional)
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Notes / Context
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any helpful links, references, or reminders..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
            />
          </div>

          {/* Subtasks Playlist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Subtasks ({subtasks.length})
              </label>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="text-xs text-teal-800 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            <div className="space-y-2">
              {subtasks.map((sub, i) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-bold text-stone-500 flex items-center justify-center font-mono shrink-0">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={sub.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubtasks((prev) =>
                        prev.map((item, idx) => (idx === i ? { ...item, title: val } : item))
                      );
                    }}
                    className="flex-1 bg-transparent text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={sub.estMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 5;
                      setSubtasks((prev) =>
                        prev.map((item, idx) => (idx === i ? { ...item, estMinutes: val } : item))
                      );
                    }}
                    className="w-12 px-1 py-0.5 text-center text-xs font-mono rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                  <span className="text-[10px] text-stone-400 font-mono">m</span>
                  <button
                    type="button"
                    onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-stone-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleDelete}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleMagicSave}
                  disabled={!title.trim() || isMagicSaving}
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isMagicSaving ? 'animate-spin' : ''}`} />
                  <span>{isMagicSaving ? 'Magic Saving...' : 'Magic Save'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES, TaskCategory, Subtask, RepeatType, CategoryMeta } from '../types';
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
  Tag,
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

export const TaskEditModal: React.FC = () => {
  const {
    isEditOpen,
    closeEdit,
    editingTask,
    categories,
    openAddCategoryModal,
    updateTask,
    deleteTask,
    startFocus,
    requestChatEdit,
    requestBreakdown,
    aiLoading,
  } = useTaskContext();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [estMinutes, setEstMinutes] = useState<number>(20);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  
  // AI Tweak states
  const [showCustomPromptBox, setShowCustomPromptBox] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [tweakingAction, setTweakingAction] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategory(editingTask.category);
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
      setSubtasks(editingTask.subtasks || []);
      setAiPrompt('');
      setShowCustomPromptBox(false);
    }
  }, [editingTask]);

  if (!isEditOpen || !editingTask) return null;

  const toggleRepeatDay = (dayId: number) => {
    setRepeatDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const isDaily = repeatType === 'daily';

    updateTask(editingTask.id, {
      title: title.trim(),
      category,
      scheduledDate: isDaily ? (scheduledDate || getTodayDateString()) : scheduledDate,
      scheduledTime: scheduledTime.trim() || null,
      repeatDaily: isDaily,
      repeatType,
      repeatDays: repeatType === 'weekly_on' ? repeatDays : undefined,
      notes: notes.trim() || undefined,
      estMinutes: estMinutes || 20,
      subtasks,
    });

    closeEdit();
  };

  const handleDelete = () => {
    deleteTask(editingTask.id);
    closeEdit();
  };

  // AI Tweaker: 1. Custom Instruction
  const handleApplyCustomAiEdit = async () => {
    if (!aiPrompt.trim()) return;
    setTweakingAction('custom');
    try {
      const result = await requestChatEdit(
        {
          ...editingTask,
          title,
          category,
          estMinutes,
          subtasks,
        },
        aiPrompt
      );

      setTitle(result.title);
      setCategory(result.category);
      setEstMinutes(result.estimatedMinutes);
      setSubtasks(
        result.subtasks.map((s, idx) => ({
          id: `edit-sub-${Date.now()}-${idx}`,
          title: s.title,
          estMinutes: s.estimatedMinutes,
          done: false,
        }))
      );
      setAiPrompt('');
      setShowCustomPromptBox(false);
    } catch (e) {
      console.error(e);
    } finally {
      setTweakingAction(null);
    }
  };

  // AI Tweaker: 2. Bite-Sized
  const handleApplyBiteSized = async () => {
    setTweakingAction('bitesize');
    try {
      const res = await requestBreakdown(title, 1, notes, category);
      setEstMinutes(res.estimatedMinutes);
      setSubtasks(
        res.subtasks.map((s, idx) => ({
          id: `edit-sub-${Date.now()}-${idx}`,
          title: s.title,
          estMinutes: s.estimatedMinutes,
          done: false,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTweakingAction(null);
    }
  };

  // AI Tweaker: 3. Faster
  const handleApplyFaster = async () => {
    setTweakingAction('faster');
    try {
      const res = await requestChatEdit(
        { ...editingTask, title, category, estMinutes, subtasks },
        'Reduce estimated time and tighten subtasks to finish faster'
      );
      setEstMinutes(res.estimatedMinutes);
      setSubtasks(
        res.subtasks.map((s, idx) => ({
          id: `edit-sub-${Date.now()}-${idx}`,
          title: s.title,
          estMinutes: s.estimatedMinutes,
          done: false,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTweakingAction(null);
    }
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

  const allCategories: Record<string, CategoryMeta> = { ...DEFAULT_CATEGORIES, ...categories };

  return (
    <div className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200/80 dark:border-stone-800 animate-slideUp overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
            Edit Task
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                closeEdit();
                startFocus(editingTask);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-1 hover:bg-teal-100"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Focus
            </button>
            <button
              onClick={closeEdit}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
          </div>

          {/* 3 AI TWEAKER BUTTONS IN EDIT MODAL */}
          <div className="bg-stone-50 dark:bg-stone-850/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                AI Task Tweakers
              </span>
              {aiLoading && (
                <span className="text-[11px] font-medium text-amber-600 animate-pulse">
                  AI is updating...
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShowCustomPromptBox(!showCustomPromptBox)}
                disabled={aiLoading}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  showCustomPromptBox
                    ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-950 dark:text-amber-200 ring-2 ring-amber-400/20'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <MessageSquareText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">AI Tweak</span>
              </button>

              <button
                type="button"
                onClick={handleApplyBiteSized}
                disabled={aiLoading}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Scissors className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">Bite-Sized</span>
              </button>

              <button
                type="button"
                onClick={handleApplyFaster}
                disabled={aiLoading}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Faster</span>
              </button>
            </div>

            {showCustomPromptBox && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. split step 2, make simpler, reduce time..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomAiEdit();
                  }}
                  autoFocus
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-stone-800 dark:text-stone-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomAiEdit}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Category with + Add Category button */}
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
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.dotColor }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Schedule Section */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5">
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate || ''}
                onChange={(e) => setScheduledDate(e.target.value || null)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200"
              />
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
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeEdit}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

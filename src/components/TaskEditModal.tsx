import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { CATEGORIES, TaskCategory, Task, Subtask } from '../types';
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
} from 'lucide-react';
import { getTodayDateString } from '../utils/storage';

export const TaskEditModal: React.FC = () => {
  const {
    isEditOpen,
    closeEdit,
    editingTask,
    updateTask,
    deleteTask,
    startFocus,
    requestChatEdit,
    aiLoading,
  } = useTaskContext();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [repeatDaily, setRepeatDaily] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [estMinutes, setEstMinutes] = useState<number>(20);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategory(editingTask.category);
      setScheduledDate(editingTask.scheduledDate);
      setScheduledTime(editingTask.scheduledTime || '');
      setRepeatDaily(Boolean(editingTask.repeatDaily));
      setNotes(editingTask.notes || '');
      setEstMinutes(editingTask.estMinutes);
      setSubtasks(editingTask.subtasks || []);
      setAiPrompt('');
    }
  }, [editingTask]);

  if (!isEditOpen || !editingTask) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    updateTask(editingTask.id, {
      title: title.trim(),
      category,
      scheduledDate: repeatDaily ? (scheduledDate || getTodayDateString()) : scheduledDate,
      scheduledTime: scheduledTime.trim() || null,
      repeatDaily: Boolean(repeatDaily),
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

  const handleApplyAiEdit = async () => {
    if (!aiPrompt.trim()) return;
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
    } catch (e) {
      console.error(e);
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

          {/* AI Chat-Edit / Tweak Panel */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Chat Tweak (Natural Language)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. split step 2 into two, make easier, shorten time..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyAiEdit();
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-amber-300/80 dark:border-amber-800 text-stone-800 dark:text-stone-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyAiEdit}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {aiLoading ? '...' : 'Tweak'}
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(CATEGORIES).map((cat) => (
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

          {/* Repeat Daily Option */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                <Repeat className="w-3.5 h-3.5" />
              </div>
              <div>
                <label htmlFor="editRepeatDaily" className="text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                  Repeat Daily
                </label>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Repeats every day at the scheduled time
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="editRepeatDaily"
              checked={repeatDaily}
              onChange={(e) => setRepeatDaily(e.target.checked)}
              className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 accent-teal-700 cursor-pointer"
            />
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

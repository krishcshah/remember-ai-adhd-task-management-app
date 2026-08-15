import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES, TaskCategory, Task, CategoryMeta } from '../types';
import {
  Search,
  CheckCircle2,
  Circle,
  Play,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Plus,
  ArrowUpRight,
  Repeat,
} from 'lucide-react';
import { getTodayDateString, isTaskScheduledForDate } from '../utils/storage';

export const LibraryView: React.FC = () => {
  const {
    tasks,
    categories,
    openAddCategoryModal,
    openRepeatModal,
    scheduleTaskForToday,
    setTaskDone,
    deleteTask,
    startFocus,
    openEdit,
    openCapture,
  } = useTaskContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<
    'all' | 'today' | 'unscheduled' | 'completed' | TaskCategory
  >('all');

  const todayStr = getTodayDateString();
  const allCategories: Record<string, CategoryMeta> = { ...DEFAULT_CATEGORIES, ...categories };

  const filteredTasks = tasks.filter((task) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = (task.notes || '').toLowerCase().includes(q);
      const matchSubs = task.subtasks.some((s) => s.title.toLowerCase().includes(q));
      if (!matchTitle && !matchNotes && !matchSubs) return false;
    }

    // Filter tab
    if (filterTab === 'all') return true;
    if (filterTab === 'today') return isTaskScheduledForDate(task, todayStr) && task.status === 'todo';
    if (filterTab === 'unscheduled') return !task.scheduledDate && !task.repeatDaily && task.status === 'todo';
    if (filterTab === 'completed') return task.status === 'done';
    return task.category === filterTab && task.status === 'todo';
  });

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 pt-3 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            Task Library
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            All your tasks filed safely • One-tap recover
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddCategoryModal}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Category
          </button>
          <button
            onClick={() => openCapture('quick')}
            className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search all tasks or subtasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Horizontal Scroll Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            filterTab === 'all'
              ? 'bg-teal-800 text-white font-semibold'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          All ({tasks.length})
        </button>

        <button
          onClick={() => setFilterTab('today')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            filterTab === 'today'
              ? 'bg-teal-800 text-white font-semibold'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          Today
        </button>

        <button
          onClick={() => setFilterTab('unscheduled')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            filterTab === 'unscheduled'
              ? 'bg-amber-600 text-white font-semibold'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          Inbox ({tasks.filter((t) => !t.scheduledDate && !t.repeatDaily && t.status === 'todo').length})
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            filterTab === 'completed'
              ? 'bg-stone-800 text-white font-semibold'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800'
          }`}
        >
          Completed
        </button>

        {Object.values(allCategories).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterTab(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterTab === cat.id
                ? 'bg-stone-800 dark:bg-stone-700 text-white font-semibold'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.dotColor }} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3 pt-1">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const meta = allCategories[task.category] || allCategories.other || DEFAULT_CATEGORIES.other;
            const isDone = task.status === 'done';
            const isToday = isTaskScheduledForDate(task, todayStr);

            // Determine repeat string
            const getRepeatBadge = () => {
              if (task.repeatType === 'daily' || task.repeatDaily) return 'Daily';
              if (task.repeatType === 'weekly') return 'Weekly';
              if (task.repeatType === 'weekly_on' && task.repeatDays?.length) {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return task.repeatDays.map((d) => dayNames[d]).join(', ');
              }
              return null;
            };
            const repeatBadge = getRepeatBadge();

            return (
              <div
                key={task.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isDone
                    ? 'bg-stone-100/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-60'
                    : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => setTaskDone(task.id, !isDone)}
                      className="mt-0.5 text-stone-400 hover:text-teal-600 focus:outline-none"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 fill-teal-600 text-white" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm text-stone-900 dark:text-stone-100 leading-snug ${
                          isDone ? 'line-through' : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.notes && (
                        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${meta.bgLight} ${meta.bgDark} ${meta.textColor}`}
                        >
                          {meta.label}
                        </span>

                        <span className="text-[11px] font-mono text-stone-500 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          ~{task.estMinutes}m
                        </span>

                        <span className="text-[11px] text-stone-400 font-mono">
                          {task.subtasks.length} {task.subtasks.length === 1 ? 'step' : 'steps'}
                        </span>

                        {/* Small Repeat Badge / Trigger Button */}
                        <button
                          onClick={() => openRepeatModal(task)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                            repeatBadge
                              ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700'
                          }`}
                          title="Configure repeating schedule"
                        >
                          <Repeat className="w-2.5 h-2.5" />
                          {repeatBadge || 'Repeat'}
                        </button>

                        {task.scheduledDate && !task.repeatDaily && (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isToday
                                ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {isToday ? 'Today' : task.scheduledDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isDone && (
                      <button
                        onClick={() => startFocus(task)}
                        className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 transition-colors"
                        title="Start Focus"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    )}

                    <button
                      onClick={() => openEdit(task)}
                      className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                      title="Edit task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Schedule for Today button if not scheduled today */}
                {!isDone && !isToday && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} steps completed
                    </span>

                    <button
                      onClick={() => scheduleTaskForToday(task.id)}
                      className="text-xs font-semibold text-teal-800 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <span>Plan for Today</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-3xl bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800 text-center">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">
              No tasks found
            </p>
            <p className="text-xs text-stone-500 mb-4">
              {searchQuery
                ? `No tasks matching "${searchQuery}"`
                : 'Your library is clear.'}
            </p>
            <button
              onClick={() => openCapture('quick')}
              className="px-4 py-2 rounded-xl bg-teal-800 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add new task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

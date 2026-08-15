import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES, Task, TaskCategory } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Pencil,
  Inbox,
  Plus,
  Repeat,
  Check,
} from 'lucide-react';
import { getTodayDateString, isTaskScheduledForDate } from '../utils/storage';

export const CalendarView: React.FC = () => {
  const {
    tasks,
    categories,
    openRepeatModal,
    scheduleTaskForToday,
    scheduleTaskForDate,
    toggleSubtask,
    setTaskDone,
    startFocus,
    openEdit,
    openCapture,
  } = useTaskContext();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);

  const allCategories = { ...DEFAULT_CATEGORIES, ...categories };

  // Generate 7 days for current week
  const getWeekDates = (offset: number) => {
    const curr = new Date();
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday + offset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: iso === getTodayDateString(),
      });
    }
    return days;
  };

  const weekDays = getWeekDates(weekOffset);

  // Get all tasks for selected date (including recurring tasks)
  const scheduledForSelected = tasks.filter((t) =>
    isTaskScheduledForDate(t, selectedDate)
  );

  // Unscheduled tasks (Brain dump inbox)
  const unscheduledTasks = tasks.filter(
    (t) => !t.repeatDaily && t.repeatType !== 'daily' && t.repeatType !== 'weekly' && t.repeatType !== 'weekly_on' && !t.scheduledDate && t.status === 'todo'
  );

  // Month dates generator
  const getMonthDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Blank days before 1st
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        iso,
        dayNumber: i,
        isToday: iso === getTodayDateString(),
      });
    }
    return days;
  };

  const monthDays = getMonthDays();

  // Helper to get category dots for a day
  const getDotsForDate = (iso: string) => {
    const dayTasks = tasks.filter((t) => isTaskScheduledForDate(t, iso) && t.status === 'todo');
    const catList = Array.from(new Set(dayTasks.map((t) => t.category))) as TaskCategory[];
    return catList.slice(0, 4);
  };

  const completedCount = scheduledForSelected.filter((t) => t.status === 'done').length;

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 pt-3 pb-24 space-y-6">
      {/* Top Header: View Toggle & Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            Calendar
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Day schedule & repeating tasks
          </p>
        </div>

        <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Week View Day Strip */}
      {viewMode === 'week' ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 shadow-sm border border-stone-200/80 dark:border-stone-800">
          {/* Week Navigation bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 font-display">
              {weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((p) => p - 1)}
                aria-label="Previous week"
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDate(getTodayDateString());
                }}
                className="px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-400 hover:underline"
              >
                Today
              </button>
              <button
                onClick={() => setWeekOffset((p) => p + 1)}
                aria-label="Next week"
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Day Horizontal Pills */}
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((d) => {
              const isSelected = d.iso === selectedDate;
              const dots = getDotsForDate(d.iso);

              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-teal-800 dark:bg-teal-700 text-white shadow-md'
                      : d.isToday
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                      : 'bg-stone-50 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/50 dark:border-stone-800'
                  }`}
                >
                  <span className="text-[11px] font-medium opacity-80 uppercase tracking-tighter">
                    {d.dayName}
                  </span>
                  <span className="font-mono text-base font-bold my-0.5">
                    {d.dayNumber}
                  </span>

                  {/* Category dot indicators */}
                  <div className="flex items-center gap-0.5 h-2">
                    {dots.map((cat, i) => {
                      const dotColor = allCategories[cat]?.dotColor || '#78716c';
                      return (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isSelected ? '#FDE047' : dotColor,
                          }}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Month Grid View */
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 shadow-sm border border-stone-200/80 dark:border-stone-800">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <span key={i} className="text-[11px] font-bold text-stone-400">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((d, idx) => {
              if (!d) return <div key={`empty-${idx}`} className="h-10" />;
              const isSelected = d.iso === selectedDate;
              const dots = getDotsForDate(d.iso);

              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center p-1 transition-all ${
                    isSelected
                      ? 'bg-teal-800 text-white font-bold'
                      : d.isToday
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-800'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className="font-mono text-xs leading-none">{d.dayNumber}</span>
                  <div className="flex gap-0.5 mt-1">
                    {dots.map((cat, i) => {
                      const dotColor = allCategories[cat]?.dotColor || '#78716c';
                      return (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: isSelected ? '#FDE047' : dotColor,
                          }}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scheduled Tasks for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-bold text-base text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <span>Tasks</span>
            <span className="text-xs font-normal text-stone-500 dark:text-stone-400">
              ({completedCount}/{scheduledForSelected.length} completed •{' '}
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })})
            </span>
          </h2>

          <button
            onClick={() => openCapture('quick')}
            className="text-xs font-semibold text-teal-800 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>

        {scheduledForSelected.length > 0 ? (
          <div className="space-y-2.5">
            {scheduledForSelected.map((task) => {
              const meta = allCategories[task.category] || allCategories.other || DEFAULT_CATEGORIES.other;
              const isDone = task.status === 'done';

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
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isDone
                      ? 'bg-stone-100/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-70'
                      : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => setTaskDone(task.id, !isDone)}
                        className="mt-0.5 text-stone-400 hover:text-teal-600 focus:outline-none"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 fill-teal-600 text-white" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-400 hover:text-teal-700" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p
                            className={`font-semibold text-sm text-stone-900 dark:text-stone-100 ${
                              isDone ? 'line-through text-stone-500 dark:text-stone-400' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {/* Small repeat button/badge */}
                          <button
                            onClick={() => openRepeatModal(task)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              repeatBadge
                                ? 'bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700'
                            }`}
                            title="Configure repeat"
                          >
                            <Repeat className="w-2.5 h-2.5" /> {repeatBadge || 'Repeat'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${meta.bgLight} ${meta.bgDark} ${meta.textColor}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[11px] font-mono text-stone-500 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {task.estMinutes}m
                          </span>
                          {task.scheduledTime && (
                            <span className="text-[11px] font-mono text-stone-500">
                              @{task.scheduledTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isDone && (
                        <button
                          onClick={() => startFocus(task)}
                          className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 transition-colors"
                          title="Start focus"
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
                    </div>
                  </div>

                  {/* Subtask micro status & checklist */}
                  {task.subtasks.length > 0 && (
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>
                          {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} steps completed
                        </span>
                        <span className="font-mono text-[10px]">
                          {Math.round(
                            (task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100
                          )}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {task.subtasks.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => toggleSubtask(task.id, sub.id)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors ${
                              sub.done
                                ? 'bg-stone-100 dark:bg-stone-800/40 text-stone-400 line-through'
                                : 'bg-stone-50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border text-[9px] ${
                                sub.done
                                  ? 'bg-teal-600 border-teal-600 text-white'
                                  : 'border-stone-300 dark:border-stone-600'
                              }`}
                            >
                              {sub.done && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                            </span>
                            <span className="truncate flex-1">{sub.title}</span>
                            <span className="font-mono text-[10px] text-stone-400 shrink-0">
                              {sub.estMinutes}m
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800 text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              No tasks scheduled for this day.
            </p>
            <button
              onClick={() => openCapture('quick')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add task for this day
            </button>
          </div>
        )}
      </div>

      {/* Unscheduled Shelf (Brain Dump Tray) */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-stone-500" />
            <h2 className="font-display font-bold text-sm text-stone-800 dark:text-stone-200">
              Unscheduled Inbox ({unscheduledTasks.length})
            </h2>
          </div>
          <span className="text-xs text-stone-500">Unscheduled items</span>
        </div>

        {unscheduledTasks.length > 0 ? (
          <div className="space-y-2">
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {task.title}
                  </p>
                  <span className="text-[11px] font-mono text-stone-500">
                    ~{task.estMinutes}m
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => scheduleTaskForToday(task.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold hover:bg-teal-200 transition-colors"
                  >
                    Plan for Today
                  </button>
                  <button
                    onClick={() => scheduleTaskForDate(task.id, selectedDate)}
                    className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 text-xs font-medium"
                    title={`Schedule for selected day (${selectedDate})`}
                  >
                    ➔ This day
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic px-1">
            Inbox is clear. Capture ideas or tasks anytime with Quick Add or Brain Dump.
          </p>
        )}
      </div>
    </div>
  );
};

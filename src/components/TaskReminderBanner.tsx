import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Bell, Play, Check, Clock, X, Sparkles } from 'lucide-react';
import { Task } from '../types';

export const TaskReminderBanner: React.FC = () => {
  const {
    activeReminders,
    dismissReminder,
    snoozeReminder,
    startFocus,
    setTaskDone,
    categories,
  } = useTaskContext();

  if (!activeReminders || activeReminders.length === 0) {
    return null;
  }

  return (
    <div
      id="task-reminder-container"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 pointer-events-none flex flex-col gap-2.5"
    >
      <AnimatePresence mode="popLayout">
        {activeReminders.map((task: Task) => {
          const category = categories[task.category] || {
            label: task.category,
            dotColor: '#0d9488',
            bgLight: 'bg-teal-50',
            bgDark: 'dark:bg-teal-950/40',
            textColor: 'text-teal-800 dark:text-teal-300',
            borderColor: 'border-teal-200 dark:border-teal-800',
          };

          const firstSubtask =
            task.subtasks && task.subtasks.length > 0
              ? task.subtasks.find((s) => !s.done) || task.subtasks[0]
              : null;

          return (
            <motion.div
              key={`reminder-${task.id}`}
              id={`task-reminder-card-${task.id}`}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="pointer-events-auto w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-stone-950/10 border border-stone-200/90 dark:border-stone-800 ring-1 ring-teal-500/30"
            >
              {/* Header: Bell Icon, Time Pill, Category, Close Button */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <Bell className="w-4 h-4 animate-bounce" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-500 rounded-full ring-2 ring-white dark:ring-stone-900 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-tight text-teal-700 dark:text-teal-300 uppercase">
                      Task Reminder
                    </span>
                    {task.scheduledTime && (
                      <span className="ml-1.5 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {task.scheduledTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${category.borderColor} ${category.bgLight} ${category.bgDark} ${category.textColor}`}
                  >
                    {category.label}
                  </span>
                  <button
                    id={`dismiss-reminder-btn-${task.id}`}
                    onClick={() => dismissReminder(task.id)}
                    aria-label="Dismiss reminder"
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task Title */}
              <h4 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug mb-1">
                {task.title}
              </h4>

              {/* Micro-Step / Subtask preview */}
              {firstSubtask && (
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-150 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">
                    <span className="font-medium text-stone-700 dark:text-stone-200">First step:</span>{' '}
                    {firstSubtask.title}
                  </span>
                  <span className="ml-auto text-[10px] text-stone-400 font-mono shrink-0">
                    ~{firstSubtask.estMinutes}m
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                <button
                  id={`focus-reminder-btn-${task.id}`}
                  onClick={() => {
                    dismissReminder(task.id);
                    startFocus(task);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.97]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Focus</span>
                </button>

                <button
                  id={`done-reminder-btn-${task.id}`}
                  onClick={() => {
                    dismissReminder(task.id);
                    setTaskDone(task.id, true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition-all active:scale-[0.97]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>

                <button
                  id={`snooze-reminder-btn-${task.id}`}
                  onClick={() => snoozeReminder(task.id, 5)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-medium transition-all active:scale-[0.97]"
                >
                  <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Snooze 5m</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

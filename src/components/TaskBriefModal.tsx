import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES, Task } from '../types';
import {
  X,
  CheckCircle2,
  Circle,
  Play,
  Pencil,
  Clock,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react';

interface TaskBriefModalProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskBriefModal: React.FC<TaskBriefModalProps> = ({ task, onClose }) => {
  const {
    categories,
    toggleSubtask,
    setTaskDone,
    startFocus,
    openEdit,
  } = useTaskContext();

  if (!task) return null;

  const allCategories = { ...DEFAULT_CATEGORIES, ...categories };
  const meta = allCategories[task.category] || allCategories.other || DEFAULT_CATEGORIES.personal;
  const isDone = task.status === 'done';

  const completedSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleToggleDone = () => {
    setTaskDone(task.id, !isDone);
  };

  const handleStartFocus = () => {
    onClose();
    startFocus(task);
  };

  const handleOpenEdit = () => {
    onClose();
    openEdit(task);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-950/50 dark:bg-stone-950/70 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${meta.bgLight} ${meta.bgDark} ${meta.textColor}`}
              >
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-lg">
                <Clock className="w-3 h-3" />
                {task.estMinutes}m
              </span>
              {task.scheduledTime && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-lg font-medium">
                  @{task.scheduledTime}
                </span>
              )}
            </div>

            {/* X Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Task Heading */}
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <button
                onClick={handleToggleDone}
                className="mt-0.5 text-stone-400 hover:text-teal-600 focus:outline-none cursor-pointer shrink-0"
              >
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 fill-teal-600 text-white" />
                ) : (
                  <Circle className="w-6 h-6 text-stone-400 hover:text-teal-600" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h2
                  className={`font-display text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug ${
                    isDone ? 'line-through text-stone-400 dark:text-stone-500' : ''
                  }`}
                >
                  {task.title}
                </h2>
                {task.notes && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {task.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-1">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Micro-Steps Checklist ({completedSubtasks}/{totalSubtasks})
              </span>
              <span className="font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-600 dark:bg-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Subtask list */}
            {task.subtasks.length > 0 ? (
              <div className="space-y-2 pt-1">
                {task.subtasks.map((sub, idx) => (
                  <motion.button
                    key={sub.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      sub.done
                        ? 'bg-stone-100/70 dark:bg-stone-800/40 text-stone-400 line-through'
                        : 'bg-stone-50 dark:bg-stone-800/80 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 shadow-2xs'
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border text-[10px] shrink-0 transition-colors ${
                        sub.done
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {sub.done && <Check className="w-3 h-3 stroke-[3px]" />}
                    </span>
                    <span className="text-xs font-medium flex-1 leading-tight">
                      <span className="text-stone-400 font-mono text-[10px] mr-1.5">{idx + 1}.</span>
                      {sub.title}
                    </span>
                    <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
                      {sub.estMinutes}m
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-center border border-dashed border-stone-200 dark:border-stone-800">
                <p className="text-xs text-stone-400">
                  No subtasks generated yet.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleDone}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isDone
                    ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100'
                }`}
              >
                {isDone ? 'Mark Incomplete' : 'Mark Done'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartFocus}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 dark:bg-teal-700 text-white text-xs font-semibold shadow-sm hover:bg-teal-900 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Focus
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

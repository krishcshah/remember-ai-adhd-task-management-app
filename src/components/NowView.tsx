import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { DEFAULT_CATEGORIES } from '../types';
import {
  Play,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Clock,
  Pencil,
  Plus,
  Compass,
  Check,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { getTodayDateString, isTaskScheduledForDate } from '../utils/storage';

export const NowView: React.FC = () => {
  const {
    activeTask,
    tasks,
    categories,
    setActiveTaskId,
    toggleSubtask,
    setTaskDone,
    startFocus,
    openEdit,
    openCapture,
    openRepeatModal,
  } = useTaskContext();

  const [isUpNextExpanded, setIsUpNextExpanded] = useState(false);

  const todayStr = getTodayDateString();
  const todayTasks = tasks.filter(
    (t) => t.status === 'todo' && isTaskScheduledForDate(t, todayStr)
  );

  const currentIndex = activeTask
    ? todayTasks.findIndex((t) => t.id === activeTask.id)
    : -1;

  const upNextTasks = todayTasks.filter((t) => activeTask && t.id !== activeTask.id);

  const handleNextTask = () => {
    if (todayTasks.length <= 1) return;
    const nextIdx = (currentIndex + 1) % todayTasks.length;
    setActiveTaskId(todayTasks[nextIdx].id);
  };

  const handlePrevTask = () => {
    if (todayTasks.length <= 1) return;
    const prevIdx = (currentIndex - 1 + todayTasks.length) % todayTasks.length;
    setActiveTaskId(todayTasks[prevIdx].id);
  };

  // If no active task
  if (!activeTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 mb-6 shadow-inner">
          <Compass className="w-10 h-10 stroke-[1.5px]" />
        </div>
        <h2 className="font-display text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          Clear horizon
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-8">
          Nothing queued for today right now. Take a breath, or brain dump whatever is on your mind.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => openCapture('braindump')}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all border border-amber-600/30"
          >
            <Sparkles className="w-4 h-4" />
            Brain dump thoughts
          </button>

          <button
            onClick={() => openCapture('quick')}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-98 text-stone-800 dark:text-stone-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add a task
          </button>
        </div>
      </div>
    );
  }

  const categoryMeta =
    categories[activeTask.category] ||
    DEFAULT_CATEGORIES[activeTask.category] ||
    DEFAULT_CATEGORIES.other;

  const completedSubtasksCount = activeTask.subtasks.filter((s) => s.done).length;
  const totalSubtasks = activeTask.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasksCount / totalSubtasks) * 100 : 0;

  // Format repeat label for the badge
  const getRepeatLabel = () => {
    if (activeTask.repeatType === 'daily' || activeTask.repeatDaily) return 'Daily';
    if (activeTask.repeatType === 'weekly') return 'Weekly';
    if (activeTask.repeatType === 'weekly_on' && activeTask.repeatDays?.length) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return activeTask.repeatDays.map((d) => dayNames[d]).join(', ');
    }
    return null;
  };

  const repeatLabel = getRepeatLabel();

  return (
    <div className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full px-4 pt-3 pb-24 sm:pb-28">
      {/* Top Navigator & Position Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryMeta.bgLight} ${categoryMeta.bgDark} ${categoryMeta.borderColor} ${categoryMeta.textColor} flex items-center gap-1.5 shrink-0 whitespace-nowrap`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: categoryMeta.dotColor }}
            />
            {categoryMeta.label}
          </span>

          <span className="text-xs font-mono text-stone-600 dark:text-stone-300 bg-stone-200/80 dark:bg-stone-800 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
            <Clock className="w-3 h-3 shrink-0" />
            ~{activeTask.estMinutes}m
          </span>

          {/* Small Repeat Badge / Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openRepeatModal(activeTask)}
            title="Configure repeating schedule"
            className={`text-xs font-medium px-2 py-1 rounded-full border flex items-center gap-1 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              repeatLabel
                ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-100'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Repeat className="w-3 h-3 shrink-0" />
            <span>{repeatLabel || 'Repeat'}</span>
          </motion.button>
        </div>

        {todayTasks.length > 1 && (
          <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800/80 rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handlePrevTask}
              aria-label="Previous task"
              className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400 px-1 font-mono">
              {currentIndex + 1} of {todayTasks.length}
            </span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleNextTask}
              aria-label="Next task"
              className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Single-Focus Card with animated task switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTask.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/80 dark:border-stone-800 flex-1 flex flex-col justify-between mb-4"
        >
          <div>
            {/* Header row: Title & Action buttons */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 leading-tight">
                {activeTask.title}
              </h1>
              <div className="flex items-center gap-1 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openRepeatModal(activeTask)}
                  className="p-2 rounded-xl text-stone-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Repeat schedule"
                  aria-label="Repeat schedule"
                >
                  <Repeat className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openEdit(activeTask)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Edit task"
                >
                  <Pencil className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Notes if available */}
            {activeTask.notes && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3 leading-relaxed bg-stone-50 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800">
                {activeTask.notes}
              </p>
            )}

            {/* Subtask Progress Header */}
            <div className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 mt-2">
              <span className="font-display font-semibold text-stone-700 dark:text-stone-300">
                {totalSubtasks > 0 ? 'Playlist Steps' : 'Steps'}
              </span>
              <span className="font-mono">
                {completedSubtasksCount}/{totalSubtasks} done
              </span>
            </div>

            {/* Progress Bar */}
            {totalSubtasks > 0 && (
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="bg-teal-600 dark:bg-teal-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            )}

            {/* Subtasks Checklist */}
            <div className="relative">
              <div className="space-y-2 max-h-[220px] sm:max-h-[250px] overflow-y-auto no-scrollbar pb-3 scroll-smooth">
                {activeTask.subtasks.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSubtask(activeTask.id, sub.id)}
                    className={`group flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl cursor-pointer transition-colors border ${
                      sub.done
                        ? 'bg-stone-50/80 dark:bg-stone-900/40 border-stone-200/50 dark:border-stone-800 text-stone-400 dark:text-stone-500'
                        : 'bg-stone-50 dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-teal-300 dark:hover:border-teal-700'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label={sub.done ? 'Mark step not done' : 'Mark step done'}
                      className="mt-0.5 text-teal-700 dark:text-teal-400 focus:outline-none shrink-0 cursor-pointer"
                    >
                      {sub.done ? (
                        <CheckCircle2 className="w-4.5 h-4.5 fill-teal-600 text-white dark:fill-teal-500 dark:text-stone-900" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-stone-400 group-hover:text-teal-600 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-medium leading-snug transition-all ${
                          sub.done ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {sub.title}
                      </p>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                      {sub.estMinutes}m
                    </span>
                  </motion.div>
                ))}

                {activeTask.subtasks.length === 0 && (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-center">
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      Single-focus task. Tap start timer below or mark done when completed.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Gradient Fade with hint if multiple steps */}
              {activeTask.subtasks.length > 3 && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-stone-900 via-white/80 dark:via-stone-900/80 to-transparent rounded-b-xl flex items-end justify-center pb-0.5">
                  <span className="text-[9px] font-semibold text-stone-400 dark:text-stone-500 tracking-wider">
                    ↓ more
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Focus Button & Completion */}
          <div className="pt-4 mt-3 sm:pt-5 sm:mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startFocus(activeTask)}
              className="flex-1 py-3 sm:py-3.5 px-3.5 sm:px-5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-display font-bold text-sm sm:text-base flex items-center justify-between gap-2 sm:gap-3 shadow-md shadow-teal-950/20 hover:shadow-lg transition-all cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-teal-950 flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                </div>
                <span className="truncate whitespace-nowrap">Start Focus Timer</span>
              </div>
              <span className="text-[11px] sm:text-xs font-mono font-medium text-teal-200 bg-teal-950/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0">
                {activeTask.estMinutes}m
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTaskDone(activeTask.id, true)}
              title="Mark entire task done"
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-center transition-colors border border-stone-200/60 dark:border-stone-700 shrink-0 cursor-pointer"
            >
              <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5px]" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Up Next Peek Strip with smooth accordion collapse */}
      {upNextTasks.length > 0 && (
        <div className="bg-stone-50/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 rounded-2xl overflow-hidden transition-all shadow-sm">
          <button
            onClick={() => setIsUpNextExpanded(!isUpNextExpanded)}
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-left hover:bg-stone-100/60 dark:hover:bg-stone-800/60 transition-colors cursor-pointer gap-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold font-display uppercase tracking-wider text-stone-700 dark:text-stone-300 shrink-0 whitespace-nowrap">
                Up Next ({upNextTasks.length})
              </span>
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate flex-1 min-w-0">
                • {upNextTasks[0].title}
              </span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                isUpNextExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isUpNextExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 pt-1 space-y-2 border-t border-stone-100 dark:border-stone-800/60">
                  {upNextTasks.map((task) => {
                    const catMeta = categories[task.category] || DEFAULT_CATEGORIES[task.category] || DEFAULT_CATEGORIES.other;
                    return (
                      <motion.div
                        key={task.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveTaskId(task.id);
                          setIsUpNextExpanded(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-stone-200/60 dark:border-stone-700 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catMeta.dotColor }}
                          />
                          <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-stone-500 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                          Switch ➔
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

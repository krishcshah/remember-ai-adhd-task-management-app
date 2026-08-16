import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Task } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Pencil,
  Inbox,
  Plus,
  Calendar as CalendarIcon,
  ChevronDown,
  Repeat,
  Sparkles,
  Brain,
  SlidersHorizontal,
} from 'lucide-react';
import { getTodayDateString, isTaskScheduledForDate, formatLocalDateToIso } from '../utils/storage';
import { TaskBriefModal } from './TaskBriefModal';

export const CalendarView: React.FC = () => {
  const {
    tasks,
    scheduleTaskForToday,
    scheduleTaskForDate,
    setTaskDone,
    openEdit,
    openCapture,
    openAiContext,
    setCurrentTab,
  } = useTaskContext();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [briefModalTask, setBriefModalTask] = useState<Task | null>(null);

  const handlePrevWeek = () => {
    setSlideDirection(-1);
    setWeekOffset((p) => p - 1);
  };

  const handleNextWeek = () => {
    setSlideDirection(1);
    setWeekOffset((p) => p + 1);
  };

  const handleGoToday = () => {
    setSlideDirection(weekOffset > 0 ? -1 : 1);
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedDate(getTodayDateString());
  };

  const handlePrevMonth = () => {
    setMonthOffset((p) => p - 1);
  };

  const handleNextMonth = () => {
    setMonthOffset((p) => p + 1);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  // Generate 7 days for current week using local dates
  const getWeekDates = (offset: number) => {
    const curr = new Date();
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() - distanceToMonday + offset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const iso = formatLocalDateToIso(d);
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

  const pendingTasks = scheduledForSelected.filter((t) => t.status === 'todo');
  const completedTasks = scheduledForSelected.filter((t) => t.status === 'done');

  // Unscheduled tasks (Brain dump inbox)
  const unscheduledTasks = tasks.filter(
    (t) => !t.repeatDaily && t.repeatType !== 'daily' && t.repeatType !== 'weekly' && t.repeatType !== 'weekly_on' && !t.scheduledDate && t.status === 'todo'
  );

  // Total uncompleted minutes left for today
  const minutesLeft = pendingTasks.reduce((acc, t) => acc + (t.estMinutes || 0), 0);

  // Month dates generator using local dates & monthOffset
  const getMonthData = (offset: number) => {
    const now = new Date();
    const targetMonthDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startDayIndex = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const iso = formatLocalDateToIso(d);
      days.push({
        iso,
        dayNumber: i,
        isToday: iso === getTodayDateString(),
      });
    }
    return {
      days,
      monthLabel: targetMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  };

  const { days: monthDays, monthLabel } = getMonthData(monthOffset);

  // Check if date has pending tasks
  const hasTasksForDate = (iso: string) => {
    return tasks.some((t) => isTaskScheduledForDate(t, iso) && t.status === 'todo');
  };

  // Format selected date header (e.g., "16 Aug")
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const selectedDateTitle = selectedDateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-3.5 pt-1 pb-24 space-y-3">
      {/* Top Header Bar: AI Context on left, Date in center, Settings on right */}
      <div className="flex items-center justify-between pt-1 pb-1">
        {/* Left: AI Context button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.08 }}
          onClick={openAiContext}
          id="header-ai-context-btn"
          className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer relative group flex items-center gap-1"
          title="Open AI Life Context & Working Style"
          aria-label="AI Life Context"
        >
          <div className="relative">
            <Brain className="w-5 h-5 text-amber-500 stroke-[2.2px]" />
            <Sparkles className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400 absolute -top-1 -right-1" />
          </div>
        </motion.button>

        {/* Center: Selected Date & View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-teal-700/50 shadow-2xs cursor-pointer transition-all"
            title="Toggle Week / Month View"
          >
            <span className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
              {selectedDateTitle}
            </span>
            <CalendarIcon className="w-4 h-4 text-teal-800 dark:text-teal-400 ml-0.5" />
          </button>
        </div>

        {/* Right: The ONE and ONLY Settings button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => setCurrentTab('settings')}
          id="header-settings-btn"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 shadow-xs hover:shadow-md transition-all cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
          title="Open Settings"
          aria-label="Settings"
        >
          <SlidersHorizontal className="w-4.5 h-4.5" />
        </motion.button>
      </div>

      {/* Week / Month Calendar Strip (Compact & Ultra Low Height) */}
      {viewMode === 'week' ? (
        <div className="bg-transparent">
          {/* Week Navigation controls (subtle) */}
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
              {weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevWeek}
                aria-label="Previous week"
                className="p-1 rounded-lg hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleGoToday}
                className="text-[10px] font-bold text-teal-800 dark:text-teal-400 hover:underline px-1 cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextWeek}
                aria-label="Next week"
                className="p-1 rounded-lg hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 7-Day Day Strip (Reference Image 3 Style) */}
          <div className="relative overflow-hidden touch-pan-y select-none">
            <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
              <motion.div
                key={weekOffset}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.16 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -35) handleNextWeek();
                  else if (info.offset.x > 35) handlePrevWeek();
                }}
                className="grid grid-cols-7 gap-1.5 cursor-grab active:cursor-grabbing w-full"
              >
                {weekDays.map((d) => {
                  const isSelected = d.iso === selectedDate;
                  const hasTasks = hasTasksForDate(d.iso);

                  return (
                    <motion.button
                      key={d.iso}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSelectedDate(d.iso)}
                      className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-800 dark:bg-teal-700 text-white shadow-sm'
                          : d.isToday
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-800'
                          : 'bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-800/80'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-medium tracking-tight ${
                          isSelected ? 'text-teal-100' : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {d.dayName}
                      </span>
                      <span className="font-mono text-sm font-bold my-0.5">
                        {d.dayNumber}
                      </span>

                      {/* Micro task indicator dot */}
                      <div className="flex items-center justify-center h-1.5">
                        {hasTasks && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-amber-300' : 'bg-teal-600 dark:bg-teal-400'
                            }`}
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Month View (Compact) */
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-3 shadow-xs border border-stone-200/80 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-display">
              {monthLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleGoToday}
                className="px-2 py-0.5 text-[11px] font-semibold text-teal-800 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <span key={i} className="text-[10px] font-bold text-stone-400">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d, idx) => {
              if (!d) return <div key={`empty-${idx}`} className="h-7" />;
              const isSelected = d.iso === selectedDate;
              const hasTasks = hasTasksForDate(d.iso);

              return (
                <motion.button
                  key={d.iso}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`h-7 rounded-lg flex flex-col items-center justify-center p-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-800 text-white font-bold'
                      : d.isToday
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border border-teal-300'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className="font-mono text-xs leading-none">{d.dayNumber}</span>
                  <div className="h-1 flex items-center justify-center mt-0.5">
                    {hasTasks && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-amber-300' : 'bg-teal-600 dark:bg-teal-400'
                        }`}
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Status & Time Left Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
            {pendingTasks.length} {pendingTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="text-xs font-mono font-medium text-stone-500 dark:text-stone-400">
          {minutesLeft}m left
        </div>
      </div>

      {/* High-Density Task List (Max Screen Real Estate, Clean Single/Two-Line Items) */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => {
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setBriefModalTask(task)}
                  className="group relative bg-white dark:bg-stone-900/90 hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl px-3 py-2.5 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2.5"
                >
                  {/* Left Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskDone(task.id, true);
                    }}
                    className="text-stone-400 hover:text-teal-600 focus:outline-none cursor-pointer shrink-0 transition-transform active:scale-90"
                    title="Mark done"
                  >
                    <Circle className="w-5 h-5 text-stone-400 hover:text-teal-600" />
                  </button>

                  {/* Task Center Info (Dense & Structured) */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 leading-snug truncate max-w-full">
                        {task.title}
                      </p>
                    </div>

                    {/* Inline metadata under or next to title */}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px]">
                      <span className="font-mono text-stone-500 dark:text-stone-400 inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {task.estMinutes}m
                      </span>

                      {task.scheduledTime && (
                        <span className="font-mono text-teal-800 dark:text-teal-300 font-medium">
                          @{task.scheduledTime}
                        </span>
                      )}

                      {(task.repeatType === 'daily' || task.repeatDaily || task.repeatType === 'weekly') && (
                        <span className="text-teal-700 dark:text-teal-400 inline-flex items-center" title="Repeating routine">
                          <Repeat className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Edit Button */}
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(task);
                      }}
                      className="p-1.5 rounded-xl opacity-70 group-hover:opacity-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all cursor-pointer"
                      title="Edit task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            /* Clean Empty State matching reference image 3 */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => openCapture('quick')}
              className="py-10 px-4 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-700/40 transition-colors group"
            >
              <p className="text-xs font-semibold text-teal-900/80 dark:text-teal-300/80 group-hover:text-teal-800 dark:group-hover:text-teal-200 transition-colors">
                tap + or click here
              </p>
              <p className="text-xs font-bold text-teal-950 dark:text-teal-100 mt-0.5">
                to add tasks for this day
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsible Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer py-1"
          >
            <span>
              {completedTasks.length} task{completedTasks.length > 1 ? 's' : ''} completed
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showCompleted ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5 pt-1.5 overflow-hidden"
              >
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setBriefModalTask(task)}
                    className="bg-stone-100/70 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl px-3 py-2 opacity-65 flex items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskDone(task.id, false);
                      }}
                      className="text-teal-600 focus:outline-none cursor-pointer shrink-0"
                      title="Mark uncompleted"
                    >
                      <CheckCircle2 className="w-5 h-5 fill-teal-600 text-white" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="line-through text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
                        {task.title}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(task);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Unscheduled Brain Dump Shelf (Ultra Compact) */}
      <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-display font-bold text-xs text-stone-700 dark:text-stone-300">
              Unscheduled Inbox ({unscheduledTasks.length})
            </span>
          </div>
        </div>

        {unscheduledTasks.length > 0 ? (
          <div className="space-y-1.5">
            {unscheduledTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => setBriefModalTask(task)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2 shadow-2xs cursor-pointer"
              >
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate flex-1">
                  {task.title}
                </p>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => scheduleTaskForToday(task.id)}
                    className="px-2 py-1 rounded-lg bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[11px] font-semibold hover:bg-teal-200 transition-colors cursor-pointer"
                  >
                    + Today
                  </button>
                  <button
                    onClick={() => scheduleTaskForDate(task.id, selectedDate)}
                    className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 text-[11px] font-medium cursor-pointer"
                    title={`Schedule for ${selectedDate}`}
                  >
                    ➔ This day
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Task Brief / Subtasks Modal (Popup with Blurred Backdrop) */}
      <TaskBriefModal
        task={briefModalTask}
        onClose={() => setBriefModalTask(null)}
      />
    </div>
  );
};

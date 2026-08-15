import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { Task, RepeatType } from '../types';
import { X, Repeat, Check, Calendar } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 0, label: 'Sun', full: 'Sunday' },
];

export const RepeatModal: React.FC = () => {
  const { isRepeatOpen, repeatTargetTask, closeRepeatModal, updateTask } = useTaskContext();

  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (repeatTargetTask) {
      if (repeatTargetTask.repeatType) {
        setRepeatType(repeatTargetTask.repeatType);
        setSelectedDays(repeatTargetTask.repeatDays || []);
      } else if (repeatTargetTask.repeatDaily) {
        setRepeatType('daily');
        setSelectedDays([]);
      } else {
        setRepeatType('none');
        setSelectedDays([]);
      }
    }
  }, [repeatTargetTask]);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSave = () => {
    if (!repeatTargetTask) return;
    updateTask(repeatTargetTask.id, {
      repeatType,
      repeatDays: repeatType === 'weekly_on' ? selectedDays : undefined,
      repeatDaily: repeatType === 'daily',
    });
    closeRepeatModal();
  };

  return (
    <AnimatePresence>
      {isRepeatOpen && repeatTargetTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeRepeatModal}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-stone-200/80 dark:border-stone-800 relative z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                    Repeat Task
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-[200px]">
                    {repeatTargetTask.title}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeRepeatModal}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {/* 1. Don't Repeat */}
              <button
                type="button"
                onClick={() => setRepeatType('none')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  repeatType === 'none'
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Don't Repeat</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    Single-occurrence task
                  </div>
                </div>
                {repeatType === 'none' && <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />}
              </button>

              {/* 2. Daily */}
              <button
                type="button"
                onClick={() => setRepeatType('daily')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  repeatType === 'daily'
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Daily</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    Repeats every day on schedule
                  </div>
                </div>
                {repeatType === 'daily' && <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />}
              </button>

              {/* 3. Weekly */}
              <button
                type="button"
                onClick={() => setRepeatType('weekly')}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  repeatType === 'weekly'
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Weekly</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    Repeats once every week
                  </div>
                </div>
                {repeatType === 'weekly' && <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />}
              </button>

              {/* 4. Weekly on... (Specific Days) */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  repeatType === 'weekly_on'
                    ? 'bg-teal-50/70 dark:bg-teal-950/60 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => setRepeatType('weekly_on')}
                >
                  <div>
                    <div className="font-bold text-xs">Weekly on...</div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">
                      Select specific days of the week
                    </div>
                  </div>
                  {repeatType === 'weekly_on' && (
                    <Check className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  )}
                </div>

                {/* Day selector pills: Mon to Sun */}
                <div className="grid grid-cols-7 gap-1 pt-1">
                  {DAYS_OF_WEEK.map((d) => {
                    const isDaySelected = selectedDays.includes(d.id);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        key={d.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRepeatType('weekly_on');
                          toggleDay(d.id);
                        }}
                        className={`h-9 rounded-xl text-xs font-bold transition-colors cursor-pointer flex flex-col items-center justify-center ${
                          isDaySelected
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                        }`}
                      >
                        <span>{d.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={closeRepeatModal}
                className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5px]" />
                Apply Schedule
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

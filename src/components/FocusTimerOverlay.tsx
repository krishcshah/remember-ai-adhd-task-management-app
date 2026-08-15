import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Subtask, Task } from '../types';
import {
  Play,
  Pause,
  Plus,
  SkipForward,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FocusTimerOverlay: React.FC<{ task: Task; onClose: () => void }> = ({
  task,
  onClose,
}) => {
  const { toggleSubtask } = useTaskContext();

  // Create playlist of subtasks (or one default step if none)
  const playlist: Subtask[] = task.subtasks.length > 0
    ? task.subtasks
    : [{ id: 'single-step', title: task.title, estMinutes: task.estMinutes || 20, done: false }];

  // Find first undone step index, or start at 0
  const initialIndex = playlist.findIndex((s) => !s.done);
  const [currentStepIndex, setCurrentStepIndex] = useState(
    initialIndex !== -1 ? initialIndex : 0
  );

  const currentStep = playlist[currentStepIndex] || playlist[0];
  const stepTargetSeconds = (currentStep.estMinutes || 5) * 60;

  const [secondsRemaining, setSecondsRemaining] = useState(stepTargetSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalFocusedSeconds, setTotalFocusedSeconds] = useState(0);

  const timerRef = useRef<any>(null);

  // Update step time when step changes
  useEffect(() => {
    if (isCompleted) return;
    setSecondsRemaining((currentStep.estMinutes || 5) * 60);
  }, [currentStepIndex, isCompleted, currentStep.estMinutes]);

  // Main countdown loop
  useEffect(() => {
    if (!isRunning || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
      setTotalFocusedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isCompleted]);

  // Formatting helpers
  const isOvertime = secondsRemaining < 0;
  const absSeconds = Math.abs(secondsRemaining);
  const displayMinutes = Math.floor(absSeconds / 60);
  const displaySeconds = absSeconds % 60;
  const formattedTime = `${isOvertime ? '+' : ''}${String(displayMinutes).padStart(2, '0')}:${String(
    displaySeconds
  ).padStart(2, '0')}`;

  // Circular progress calculation
  const totalTargetSecs = (currentStep.estMinutes || 5) * 60;
  const progressRatio = isOvertime
    ? 1
    : Math.max(0, Math.min(1, (totalTargetSecs - secondsRemaining) / totalTargetSecs));
  const strokeDashoffset = 100 - progressRatio * 100;

  // Next step handler
  const advanceToNextStep = useCallback((markCurrentDone = true) => {
    if (markCurrentDone && currentStep.id !== 'single-step') {
      toggleSubtask(task.id, currentStep.id);
    }

    if (currentStepIndex + 1 < playlist.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed all steps!
      setIsCompleted(true);
      setIsRunning(false);

      // Trigger calm celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2F6156', '#E08B38', '#5DA394', '#F4D35E'],
          disableForReducedMotion: true,
        });
      } catch (e) {}
    }
  }, [currentStep, currentStepIndex, playlist.length, task.id, toggleSubtask]);

  const handleAddFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
  };

  // Completion Screen View
  if (isCompleted) {
    const minutesFocused = Math.max(1, Math.round(totalFocusedSeconds / 60));
    return (
      <div className="fixed inset-0 z-50 bg-[#162E27] text-stone-100 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-24 h-24 rounded-full bg-teal-900/80 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-6 shadow-2xl">
          <Sparkles className="w-12 h-12" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-50 mb-2">
          Focus Complete!
        </h1>
        <p className="text-teal-200/80 text-sm max-w-sm mb-6 leading-relaxed">
          You worked through all steps for <span className="font-semibold text-white">"{task.title}"</span>.
        </p>

        <div className="bg-teal-950/60 border border-teal-800/60 rounded-2xl p-4 mb-8 flex items-center gap-6 justify-center">
          <div className="text-center">
            <span className="text-xs text-teal-400 font-medium uppercase tracking-wider block">
              Time Focused
            </span>
            <span className="font-mono text-2xl font-bold text-amber-300">
              {minutesFocused} min
            </span>
          </div>
          <div className="w-px h-8 bg-teal-800" />
          <div className="text-center">
            <span className="text-xs text-teal-400 font-medium uppercase tracking-wider block">
              Steps Done
            </span>
            <span className="font-mono text-2xl font-bold text-amber-300">
              {playlist.length} / {playlist.length}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full max-w-xs py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-teal-950 font-display font-bold text-base shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
        >
          <span>Return to Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#162E27] text-stone-100 flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Top Header: Step Tracker & Close */}
      <div className="flex items-center justify-between safe-top">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 flex items-center gap-1.5 font-mono">
            <ListTodo className="w-3.5 h-3.5" />
            Step {currentStepIndex + 1} of {playlist.length}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Exit focus mode"
          className="p-2.5 rounded-full bg-teal-950/60 border border-teal-800 text-stone-300 hover:text-white hover:bg-teal-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Stage: Circular Progress Ring & Current Step */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full text-center">
        {/* Parent Task Title Pill */}
        <p className="text-xs text-teal-300/80 uppercase font-semibold tracking-wider mb-2 truncate max-w-xs">
          {task.title}
        </p>

        {/* Circular Progress Gauge */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-teal-950"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Active progress circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ${
                isOvertime ? 'stroke-amber-500/80' : 'stroke-amber-400'
              }`}
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={`${(strokeDashoffset * 276.46) / 100}`}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digits & Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono text-5xl sm:text-6xl font-extrabold tracking-tight timer-digits ${
                isOvertime ? 'text-amber-400' : 'text-stone-50'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-xs text-teal-300/70 font-medium mt-1">
              {isOvertime ? 'Calm overtime • Take your time' : isRunning ? 'In flow' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Current Active Step Heading */}
        <div className="mt-2 px-4 max-w-sm">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-100 leading-snug">
            {currentStep.title}
          </h2>
        </div>

        {/* Next step preview if any */}
        {currentStepIndex + 1 < playlist.length && (
          <p className="text-xs text-teal-400/70 mt-3 truncate max-w-xs">
            Next: {playlist[currentStepIndex + 1].title}
          </p>
        )}
      </div>

      {/* Bottom Controls Bar (Big touch targets >= 44px) */}
      <div className="w-full max-w-md mx-auto space-y-4 safe-bottom">
        <div className="flex items-center justify-center gap-4">
          {/* +5 Min Buffer Button */}
          <button
            onClick={handleAddFiveMinutes}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border border-teal-800/80 text-teal-200 font-mono text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>5 min</span>
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 rounded-full bg-teal-800 hover:bg-teal-700 text-stone-100 flex items-center justify-center shadow-lg border border-teal-600/40 transition-transform active:scale-95"
            aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
          >
            {isRunning ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip Step Button */}
          <button
            onClick={() => advanceToNextStep(false)}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border border-teal-800/80 text-stone-300 font-medium text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <span>Skip</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Step Done Button */}
        <button
          onClick={() => advanceToNextStep(true)}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-teal-950 font-display font-bold text-base flex items-center justify-center gap-2.5 shadow-xl transition-all"
        >
          <Check className="w-5 h-5 stroke-[3px]" />
          <span>
            {currentStepIndex + 1 === playlist.length ? 'Finish Task' : 'Done • Next Step'}
          </span>
        </button>
      </div>
    </div>
  );
};

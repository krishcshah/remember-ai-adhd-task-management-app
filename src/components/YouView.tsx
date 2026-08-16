import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useTaskContext } from '../context/TaskContext';
import { CATEGORIES, getCategoryInfo } from '../types';
import { getTodayDateString, isTaskScheduledForDate } from '../utils/storage';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  Brain,
  SlidersHorizontal,
  Calendar,
  Target,
  ArrowRight,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';

export const YouView: React.FC = () => {
  const { tasks, user, settings, setCurrentTab, openAiContext } = useTaskContext();

  const todayStr = getTodayDateString();

  // Completed & Active calculations
  const stats = useMemo(() => {
    const allCompleted = tasks.filter((t) => t.status === 'done');
    const todayCompleted = allCompleted.filter((t) =>
      isTaskScheduledForDate(t, todayStr) || (t.completedAt && t.completedAt.startsWith(todayStr))
    );
    const todayScheduled = tasks.filter((t) => isTaskScheduledForDate(t, todayStr));

    // Focus / Completed Minutes
    const totalMinutesWon = allCompleted.reduce((acc, t) => acc + (t.estMinutes || 0), 0);
    const todayMinutesWon = todayCompleted.reduce((acc, t) => acc + (t.estMinutes || 0), 0);

    // Subtasks completed
    let totalSubtasksDone = 0;
    tasks.forEach((t) => {
      t.subtasks.forEach((s) => {
        if (s.done) totalSubtasksDone++;
      });
    });

    // Completion Rate today
    const todayTotal = todayScheduled.length;
    const todayRate = todayTotal > 0 ? Math.round((todayCompleted.length / todayTotal) * 100) : 100;

    // Category distribution of completed tasks
    const catCounts: Record<string, number> = {};
    CATEGORIES.forEach((c) => (catCounts[c.id] = 0));
    allCompleted.forEach((t) => {
      const cat = (t.category || 'other').toLowerCase();
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Last 7 days activity computation
    const last7Days: { label: string; dateStr: string; count: number; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const completedOnDate = allCompleted.filter((t) =>
        isTaskScheduledForDate(t, iso) || (t.completedAt && t.completedAt.startsWith(iso))
      ).length;
      last7Days.push({
        label: dayLabel,
        dateStr: iso,
        count: completedOnDate,
        isToday: iso === todayStr,
      });
    }

    // Active Streak (consecutive days with at least 1 completed task)
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const hasDone = allCompleted.some((t) =>
        isTaskScheduledForDate(t, iso) || (t.completedAt && t.completedAt.startsWith(iso))
      );
      if (hasDone) {
        streak++;
      } else if (i === 0) {
        // Today hasn't had a completion yet, check yesterday
        continue;
      } else {
        break;
      }
    }

    return {
      allCompletedCount: allCompleted.length,
      todayCompletedCount: todayCompleted.length,
      totalMinutesWon,
      todayMinutesWon,
      totalSubtasksDone,
      todayRate,
      catCounts,
      last7Days,
      streak: Math.max(streak, allCompleted.length > 0 ? 1 : 0),
      recentDone: allCompleted.slice(-8).reverse(),
    };
  }, [tasks, todayStr]);

  const maxDailyCount = Math.max(...stats.last7Days.map((d) => d.count), 4);

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 pt-2 pb-24 space-y-4">
      {/* Top Profile Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-800 dark:bg-teal-700 text-teal-100 flex items-center justify-center font-bold text-base shadow-sm border border-teal-700/60 dark:border-teal-600/60">
            {user?.displayName ? (
              user.displayName.charAt(0).toUpperCase()
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 leading-none">
                {user?.displayName || 'You'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                {stats.streak} Day Streak
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {user?.email || 'ADHD Momentum & Focus Analytics'}
            </p>
          </div>
        </div>

        {/* Quick Settings Action */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={openAiContext}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
            title="Edit AI Brain Context"
            aria-label="AI Context"
          >
            <Brain className="w-4 h-4 text-amber-500" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setCurrentTab('settings')}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700/80"
            title="Open Settings"
            aria-label="Settings"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          </motion.button>
        </div>
      </div>

      {/* Primary Momentum Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-medium">Done Today</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {stats.todayCompletedCount}
          </div>
          <p className="text-[10px] text-stone-400">
            {stats.todayRate}% of schedule
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-medium">Total Conquered</span>
            <Target className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {stats.allCompletedCount}
          </div>
          <p className="text-[10px] text-stone-400">All-time tasks</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-medium">Time Won</span>
            <Clock className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {stats.totalMinutesWon >= 60
              ? `${(stats.totalMinutesWon / 60).toFixed(1)}h`
              : `${stats.totalMinutesWon}m`}
          </div>
          <p className="text-[10px] text-stone-400">{stats.todayMinutesWon}m today</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-medium">Micro-Steps</span>
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {stats.totalSubtasksDone}
          </div>
          <p className="text-[10px] text-stone-400">Low-friction wins</p>
        </div>
      </div>

      {/* 7-Day Completion Velocity Chart */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                7-Day Momentum Activity
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Completed tasks across the week
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-xl">
            {stats.last7Days.reduce((acc, d) => acc + d.count, 0)} completed
          </span>
        </div>

        {/* Bar Visual */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-7 gap-2 items-end h-28 px-1">
            {stats.last7Days.map((day) => {
              const heightPercent = Math.max((day.count / maxDailyCount) * 100, 8);
              return (
                <div key={day.dateStr} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono font-semibold text-stone-500 dark:text-stone-400">
                    {day.count > 0 ? day.count : ''}
                  </span>
                  <div className="w-full bg-stone-100 dark:bg-stone-800/80 rounded-xl h-20 flex items-end p-1 overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={`w-full rounded-lg transition-all ${
                        day.isToday
                          ? 'bg-teal-600 dark:bg-teal-500 shadow-xs'
                          : day.count > 0
                          ? 'bg-teal-800/70 dark:bg-teal-700/70'
                          : 'bg-stone-200/50 dark:bg-stone-700/40'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      day.isToday
                        ? 'text-teal-800 dark:text-teal-300 font-bold'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown & ADHD Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Category Breakdown */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>Category Distribution</span>
            </h2>
          </div>

          <div className="space-y-2 pt-1">
            {CATEGORIES.map((cat) => {
              const count = stats.catCounts[cat.id] || 0;
              const percent =
                stats.allCompletedCount > 0
                  ? Math.round((count / stats.allCompletedCount) * 100)
                  : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-800 dark:bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ADHD Mindset & AI Context Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50/70 to-stone-50 dark:from-amber-950/20 dark:to-stone-900 border border-amber-200/60 dark:border-amber-900/40 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                ADHD Momentum Engine
              </h2>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              "Consistency beats intensity. Micro-steps prevent paralysis. Clear the schedule, conquer one small win, and let dopamine carry the next step."
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-stone-800/80 border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between gap-2">
            <div className="text-[11px]">
              <p className="font-semibold text-stone-800 dark:text-stone-200">
                AI Life Context
              </p>
              <p className="text-stone-500 dark:text-stone-400 line-clamp-1">
                {settings.context || 'Tap to customize your ADHD prompt context'}
              </p>
            </div>
            <button
              onClick={openAiContext}
              className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs"
            >
              <Brain className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Accomplishments Log */}
      {stats.recentDone.length > 0 && (
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Recent Accomplishments</span>
            </h2>
            <span className="text-[11px] font-medium text-stone-400">
              Last {stats.recentDone.length} finished
            </span>
          </div>

          <div className="space-y-1.5 divide-y divide-stone-100 dark:divide-stone-800">
            {stats.recentDone.map((task) => {
              const catInfo = getCategoryInfo(task.category);
              return (
                <div
                  key={task.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg ${catInfo.bgLight} ${catInfo.bgDark} ${catInfo.textColor} font-medium`}>
                      {catInfo.emoji} {catInfo.label}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {task.estMinutes}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

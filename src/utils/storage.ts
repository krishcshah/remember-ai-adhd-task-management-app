import { Task, Settings, CategoryMeta, DEFAULT_CATEGORIES } from '../types';

const TASKS_STORAGE_KEY = 'remember_tasks_v2';
const LEGACY_TASKS_STORAGE_KEY = 'anchor_tasks_v1';
const SETTINGS_STORAGE_KEY = 'remember_settings_v2';
const LEGACY_SETTINGS_STORAGE_KEY = 'anchor_settings_v1';
const ACTIVE_TASK_KEY = 'remember_active_task_v2';
const CATEGORIES_STORAGE_KEY = 'remember_custom_categories_v2';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultSettings(): Settings {
  return {
    context: 'I have ADHD and struggle with task initiation. Keeping steps ultra-concrete and bite-sized under 15 minutes helps me avoid overwhelm.',
    theme: 'light',
    difficulty: 1, // Default to Small / Bite-size granularity everywhere
    autoRolloverPending: true, // Auto rollover uncompleted tasks to Today
    notificationsEnabled: true,
    notificationSound: true,
  };
}

/**
 * Rolls over uncompleted/pending past tasks to today's date if auto-rollover is enabled.
 */
export function rollOverPastPendingTasks(tasks: Task[]): { updatedTasks: Task[]; rolledCount: number } {
  const today = getTodayDateString();
  let rolledCount = 0;

  const updatedTasks = tasks.map((t) => {
    // Only roll over non-repeating or weekly tasks that have a specific scheduledDate in the past and are still 'todo'
    if (
      t.status === 'todo' &&
      t.scheduledDate &&
      t.scheduledDate < today &&
      t.repeatType !== 'daily' &&
      !t.repeatDaily
    ) {
      rolledCount++;
      return {
        ...t,
        scheduledDate: today,
        notes: t.notes ? `${t.notes} (Rolled over from ${t.scheduledDate})` : `Rolled over from ${t.scheduledDate}`,
      };
    }
    return t;
  });

  return { updatedTasks, rolledCount };
}

export function formatLocalDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultInitialTasks(): Task[] {
  const today = getTodayDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDateToIso(tomorrow);

  return [
    {
      id: 'task-daily-1',
      title: 'Morning Anchor: Hygiene & Vitamins',
      category: 'personal',
      estMinutes: 15,
      scheduledDate: today,
      scheduledTime: '08:30',
      repeatDaily: true,
      repeatType: 'daily',
      status: 'todo',
      notes: 'Daily grounding start to prepare mind and body.',
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub-d-1', title: 'Take daily morning vitamins with full glass of water', estMinutes: 2, done: false },
        { id: 'sub-d-2', title: 'Brush teeth & rinse face with cold water', estMinutes: 4, done: false },
        { id: 'sub-d-3', title: 'Fill 32oz water bottle for desk', estMinutes: 2, done: false },
      ],
    },
    {
      id: 'task-1',
      title: 'Tidy up desk and organize workspace',
      category: 'chores',
      estMinutes: 15,
      scheduledDate: today,
      scheduledTime: '10:30',
      status: 'todo',
      notes: 'Clear the clutter to reduce visual noise and start fresh.',
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: 'sub-1-1', title: 'Put away empty coffee mugs and glasses in the kitchen', estMinutes: 3, done: true },
        { id: 'sub-1-2', title: 'Stack notebooks and put pens back in organizer', estMinutes: 4, done: false },
        { id: 'sub-1-3', title: 'Wipe down desktop and keyboard surface with a cloth', estMinutes: 5, done: false },
        { id: 'sub-1-4', title: 'Fill water bottle and sit down ready for the day', estMinutes: 3, done: false },
      ],
    },
    {
      id: 'task-2',
      title: 'Prepare quarterly project summary',
      category: 'work',
      estMinutes: 30,
      scheduledDate: today,
      scheduledTime: '14:00',
      status: 'todo',
      notes: 'Break into small steps so it does not feel intimidating.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      subtasks: [
        { id: 'sub-2-1', title: 'Download last month project status document', estMinutes: 5, done: false },
        { id: 'sub-2-2', title: 'Gather key highlights and milestone dates', estMinutes: 10, done: false },
        { id: 'sub-2-3', title: 'Draft 3 bullet points of progress', estMinutes: 10, done: false },
        { id: 'sub-2-4', title: 'Send summary update to the team', estMinutes: 5, done: false },
      ],
    },
    {
      id: 'task-night-1',
      title: 'Night wind-down & journal',
      category: 'personal',
      estMinutes: 15,
      scheduledDate: today,
      scheduledTime: '23:00',
      repeatDaily: true,
      repeatType: 'daily',
      status: 'todo',
      notes: 'Calm routine to disconnect from screens before sleep.',
      createdAt: new Date(Date.now() - 18000000).toISOString(),
      subtasks: [
        { id: 'sub-n-1', title: 'Plug phone across the room to charge', estMinutes: 2, done: false },
        { id: 'sub-n-2', title: 'Jot down 3 quick thoughts from today', estMinutes: 5, done: false },
        { id: 'sub-n-3', title: 'Dim lights and set alarm for tomorrow', estMinutes: 2, done: false },
      ],
    },
    {
      id: 'task-3',
      title: 'Review lecture notes & flashcards',
      category: 'study',
      estMinutes: 25,
      scheduledDate: tomorrowStr,
      scheduledTime: '11:00',
      status: 'todo',
      notes: 'Focus on key concepts from chapter 4.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      subtasks: [
        { id: 'sub-3-1', title: 'Open study guide and highlight summary terms', estMinutes: 5, done: false },
        { id: 'sub-3-2', title: 'Review 10 flashcards on spaced repetition', estMinutes: 15, done: false },
        { id: 'sub-3-3', title: 'Write down 1 practice question to test recall', estMinutes: 5, done: false },
      ],
    },
    {
      id: 'task-4',
      title: 'Brainstorm birthday present idea for Maya',
      category: 'personal',
      estMinutes: 15,
      scheduledDate: null, // Unscheduled Brain Dump Inbox
      scheduledTime: null,
      status: 'todo',
      notes: 'Likes pottery, specialty matcha, sci-fi audiobooks',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      subtasks: [
        { id: 'sub-4-1', title: 'Jot down 3 specific things she mentioned recently', estMinutes: 5, done: false },
        { id: 'sub-4-2', title: 'Check local ceramic artisan shop website', estMinutes: 10, done: false },
      ],
    },
  ];
}

/**
 * Orders tasks in a natural, logical ADHD-friendly day schedule:
 * 1. Morning and daytime timed tasks in chronological order (04:00 - 19:59, like 8:30 AM morning routines) on TOP.
 * 2. Untimed scheduled tasks (no specific scheduledTime) in the MIDDLE.
 * 3. Late night timed tasks (20:00 - 23:59, like 11:00 PM evening routines) at the BOTTOM of scheduled tasks.
 * 4. Unscheduled / Brain Dump Inbox tasks (scheduledDate === null) at the ABSOLUTE BOTTOM.
 */
export function sortTasksLogically(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Unscheduled tasks stay at the absolute bottom
    const aIsUnscheduled = !a.scheduledDate && !a.repeatDaily && a.repeatType !== 'daily' && a.repeatType !== 'weekly' && a.repeatType !== 'weekly_on';
    const bIsUnscheduled = !b.scheduledDate && !b.repeatDaily && b.repeatType !== 'daily' && b.repeatType !== 'weekly' && b.repeatType !== 'weekly_on';

    if (aIsUnscheduled && !bIsUnscheduled) return 1;
    if (!aIsUnscheduled && bIsUnscheduled) return -1;

    // Helper to categorize time tiers
    const getTimeTier = (task: Task) => {
      if (!task.scheduledTime || !task.scheduledTime.trim()) {
        return { tier: 2, minutes: 720 }; // Untimed tasks = Tier 2 (Middle)
      }
      
      const parts = task.scheduledTime.split(':');
      const hours = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      const totalMinutes = hours * 60 + mins;

      if (hours >= 20 || hours < 4) {
        // Late night (Tier 3: 20:00 - 23:59 or early midnight wind-down)
        return { tier: 3, minutes: hours < 4 ? totalMinutes + 1440 : totalMinutes };
      } else {
        // Morning / Daytime / Afternoon (Tier 1: 04:00 - 19:59)
        return { tier: 1, minutes: totalMinutes };
      }
    };

    const aTime = getTimeTier(a);
    const bTime = getTimeTier(b);

    if (aTime.tier !== bTime.tier) {
      return aTime.tier - bTime.tier;
    }

    if (aTime.minutes !== bTime.minutes) {
      return aTime.minutes - bTime.minutes;
    }

    // Secondary sort: Status (todo before done)
    if (a.status !== b.status) {
      return a.status === 'todo' ? -1 : 1;
    }

    // Tertiary sort: Creation timestamp
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

/**
 * Checks whether a task should appear on a specific ISO date ('YYYY-MM-DD').
 * Handles daily repeat, weekly on specific days, weekly on created day, and direct scheduled date.
 */
export function isTaskScheduledForDate(task: Task, dateIso: string): boolean {
  if (task.repeatType === 'daily' || task.repeatDaily) {
    return true;
  }

  const targetDate = new Date(dateIso + 'T12:00:00');
  // Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const dayOfWeek = targetDate.getDay();

  if (task.repeatType === 'weekly_on' && Array.isArray(task.repeatDays) && task.repeatDays.length > 0) {
    return task.repeatDays.includes(dayOfWeek);
  }

  if (task.repeatType === 'weekly') {
    // If weekly without explicit repeatDays, use the scheduled date or created date's day of week
    const baseDateStr = task.scheduledDate || task.createdAt;
    if (baseDateStr) {
      const baseDate = new Date(baseDateStr.includes('T') ? baseDateStr : baseDateStr + 'T12:00:00');
      return baseDate.getDay() === dayOfWeek;
    }
  }

  return task.scheduledDate === dateIso;
}

const INITIALIZED_FLAG_KEY = 'remember_initialized_v2';

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_TASKS_STORAGE_KEY);
    if (legacyRaw !== null) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    const isInitialized = localStorage.getItem(INITIALIZED_FLAG_KEY);
    // If first time ever visiting the app (no initialized flag and no stored key)
    if (!isInitialized && raw === null && legacyRaw === null) {
      const initial = getDefaultInitialTasks();
      saveTasksToStorage(initial);
      localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
      return initial;
    }

    return [];
  } catch (err) {
    console.warn('Failed to load tasks from storage:', err);
    return [];
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(INITIALIZED_FLAG_KEY, 'true');
  } catch (err) {
    console.error('Failed to save tasks:', err);
  }
}

export function loadCustomCategories(): Record<string, CategoryMeta> {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CATEGORIES, ...parsed };
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCustomCategories(categories: Record<string, CategoryMeta>) {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function loadSettingsFromStorage(): Settings {
  try {
    let raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    }
    if (!raw) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(raw) };
  } catch (err) {
    return getDefaultSettings();
  }
}

export function saveSettingsToStorage(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadActiveTaskId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TASK_KEY);
  } catch {
    return null;
  }
}

export function saveActiveTaskId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_TASK_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_TASK_KEY);
    }
  } catch {}
}

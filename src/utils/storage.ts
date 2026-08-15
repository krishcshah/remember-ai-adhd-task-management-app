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

export function getDefaultInitialTasks(): Task[] {
  const today = getTodayDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      id: 'task-daily-1',
      title: 'Morning Anchor: Hygiene & Vitamins',
      category: 'health',
      estMinutes: 15,
      scheduledDate: today,
      scheduledTime: '08:00',
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
      category: 'personal',
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
      title: 'Prepare quarterly tax receipts and summary',
      category: 'work',
      estMinutes: 30,
      scheduledDate: today,
      scheduledTime: '14:00',
      status: 'todo',
      notes: 'Break into small steps so it does not feel intimidating.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      subtasks: [
        { id: 'sub-2-1', title: 'Open banking app and download last month statement PDF', estMinutes: 5, done: false },
        { id: 'sub-2-2', title: 'Search email for "receipt" or "invoice" and save to tax folder', estMinutes: 10, done: false },
        { id: 'sub-2-3', title: 'Log total expenses into accounting spreadsheet', estMinutes: 10, done: false },
        { id: 'sub-2-4', title: 'Send summary email to accountant', estMinutes: 5, done: false },
      ],
    },
    {
      id: 'task-3',
      title: 'Schedule dentist check-up and teeth cleaning',
      category: 'health',
      estMinutes: 15,
      scheduledDate: tomorrowStr,
      scheduledTime: '11:00',
      status: 'todo',
      notes: 'Been putting this off for a couple weeks.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      subtasks: [
        { id: 'sub-3-1', title: 'Find insurance card in wallet', estMinutes: 2, done: false },
        { id: 'sub-3-2', title: 'Call dentist reception desk for Thursday slot', estMinutes: 7, done: false },
        { id: 'sub-3-3', title: 'Add confirmed appointment time to calendar', estMinutes: 2, done: false },
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

export function loadTasksFromStorage(): Task[] {
  try {
    let raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_TASKS_STORAGE_KEY);
    }
    if (!raw) {
      const initial = getDefaultInitialTasks();
      saveTasksToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultInitialTasks();
  } catch (err) {
    console.warn('Failed to load tasks from storage:', err);
    return getDefaultInitialTasks();
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
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

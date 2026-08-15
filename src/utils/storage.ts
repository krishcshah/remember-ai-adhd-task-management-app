import { Task, Settings } from '../types';

const TASKS_STORAGE_KEY = 'anchor_tasks_v1';
const SETTINGS_STORAGE_KEY = 'anchor_settings_v1';
const ACTIVE_TASK_KEY = 'anchor_active_task_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultSettings(): Settings {
  return {
    context: 'I have ADHD and struggle with task initiation in the afternoon. Keeping steps ultra-concrete and under 15 minutes helps me avoid overwhelm.',
    theme: 'light',
    difficulty: 2,
  };
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
      estMinutes: 20,
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
      estMinutes: 35,
      scheduledDate: today,
      scheduledTime: '14:00',
      status: 'todo',
      notes: 'Break into small steps so it does not feel intimidating.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      subtasks: [
        { id: 'sub-2-1', title: 'Open banking app and download last month statement PDF', estMinutes: 5, done: false },
        { id: 'sub-2-2', title: 'Search email for "receipt" or "invoice" and save to tax folder', estMinutes: 10, done: false },
        { id: 'sub-2-3', title: 'Log total expenses into accounting spreadsheet', estMinutes: 12, done: false },
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
      estMinutes: 20,
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
    {
      id: 'task-5',
      title: 'Pick up dry cleaning on 4th street',
      category: 'errands',
      estMinutes: 25,
      scheduledDate: null, // Unscheduled Inbox
      scheduledTime: null,
      status: 'todo',
      createdAt: new Date(Date.now() - 28800000).toISOString(),
      subtasks: [
        { id: 'sub-5-1', title: 'Grab dry cleaning claim ticket from counter', estMinutes: 2, done: false },
        { id: 'sub-5-2', title: 'Drive to dry cleaners before 6 PM close', estMinutes: 15, done: false },
      ],
    },
  ];
}

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
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

export function loadSettingsFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
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

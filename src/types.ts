export type TaskCategory = 'work' | 'personal' | 'health' | 'errands' | 'study' | 'other';

export interface Subtask {
  id: string;
  title: string;
  estMinutes: number;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  estMinutes: number;
  subtasks: Subtask[];
  scheduledDate: string | null; // ISO 'YYYY-MM-DD' or null (null = "brain dump" inbox)
  scheduledTime: string | null; // "HH:MM" or null
  status: 'todo' | 'done';
  notes?: string;
  createdAt: string; // ISO string
  completedAt?: string | null;
  repeatDaily?: boolean; // If true, repeats daily at scheduledTime
}

export interface Settings {
  apiKey?: string; // Optional client-override if desired
  context: string; // Life context injected into every AI prompt
  theme: 'light' | 'dark' | 'system';
  difficulty: 1 | 2 | 3; // 1: bite-size | 2: normal | 3: deep steps
}

export type ActiveTab = 'now' | 'calendar' | 'library' | 'settings';

export interface CategoryMeta {
  id: TaskCategory;
  label: string;
  color: string; // Tailwind background/badge styling
  borderColor: string;
  dotColor: string;
  textColor: string;
  bgLight: string;
  bgDark: string;
}

export const CATEGORIES: Record<TaskCategory, CategoryMeta> = {
  work: {
    id: 'work',
    label: 'Work',
    color: 'bg-emerald-600',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    dotColor: '#059669',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
  },
  personal: {
    id: 'personal',
    label: 'Personal',
    color: 'bg-teal-600',
    borderColor: 'border-teal-200 dark:border-teal-800',
    dotColor: '#0d9488',
    textColor: 'text-teal-800 dark:text-teal-300',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/40',
  },
  health: {
    id: 'health',
    label: 'Health',
    color: 'bg-rose-600',
    borderColor: 'border-rose-200 dark:border-rose-800',
    dotColor: '#e11d48',
    textColor: 'text-rose-800 dark:text-rose-300',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/40',
  },
  errands: {
    id: 'errands',
    label: 'Errands',
    color: 'bg-amber-600',
    borderColor: 'border-amber-200 dark:border-amber-800',
    dotColor: '#d97706',
    textColor: 'text-amber-800 dark:text-amber-300',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/40',
  },
  study: {
    id: 'study',
    label: 'Study',
    color: 'bg-sky-600',
    borderColor: 'border-sky-200 dark:border-sky-800',
    dotColor: '#0284c7',
    textColor: 'text-sky-800 dark:text-sky-300',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/40',
  },
  other: {
    id: 'other',
    label: 'Other',
    color: 'bg-stone-500',
    borderColor: 'border-stone-200 dark:border-stone-700',
    dotColor: '#78716c',
    textColor: 'text-stone-700 dark:text-stone-300',
    bgLight: 'bg-stone-100',
    bgDark: 'dark:bg-stone-800/40',
  },
};

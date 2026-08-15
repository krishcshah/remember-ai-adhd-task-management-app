export type TaskCategory = string;

export type RepeatType = 'none' | 'daily' | 'weekly' | 'weekly_on';

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
  repeatDaily?: boolean; // legacy convenience
  repeatType?: RepeatType; // 'none' | 'daily' | 'weekly' | 'weekly_on'
  repeatDays?: number[]; // [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat] or 1-7 Mon-Sun
}

export interface Settings {
  apiKey?: string; // Optional client-override if desired
  context: string; // Life context injected into every AI prompt
  theme: 'light' | 'dark' | 'system';
  difficulty: 1 | 2 | 3; // 1: bite-size (default) | 2: normal | 3: deep steps
  customCategories?: CategoryMeta[];
}

export type ActiveTab = 'now' | 'calendar' | 'library' | 'settings';

export interface CategoryMeta {
  id: string;
  label: string;
  color: string; // Tailwind background/badge styling
  borderColor: string;
  dotColor: string;
  textColor: string;
  bgLight: string;
  bgDark: string;
}

export const DEFAULT_CATEGORIES: Record<string, CategoryMeta> = {
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

export const CATEGORIES = DEFAULT_CATEGORIES;

export const COLOR_PALETTES = [
  { id: 'indigo', label: 'Indigo', dotColor: '#6366f1', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-950/40', borderColor: 'border-indigo-200 dark:border-indigo-800', textColor: 'text-indigo-800 dark:text-indigo-300' },
  { id: 'purple', label: 'Purple', dotColor: '#a855f7', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-950/40', borderColor: 'border-purple-200 dark:border-purple-800', textColor: 'text-purple-800 dark:text-purple-300' },
  { id: 'pink', label: 'Pink', dotColor: '#ec4899', bgLight: 'bg-pink-50', bgDark: 'dark:bg-pink-950/40', borderColor: 'border-pink-200 dark:border-pink-800', textColor: 'text-pink-800 dark:text-pink-300' },
  { id: 'cyan', label: 'Cyan', dotColor: '#06b6d4', bgLight: 'bg-cyan-50', bgDark: 'dark:bg-cyan-950/40', borderColor: 'border-cyan-200 dark:border-cyan-800', textColor: 'text-cyan-800 dark:text-cyan-300' },
  { id: 'lime', label: 'Lime', dotColor: '#84cc16', bgLight: 'bg-lime-50', bgDark: 'dark:bg-lime-950/40', borderColor: 'border-lime-200 dark:border-lime-800', textColor: 'text-lime-800 dark:text-lime-300' },
  { id: 'orange', label: 'Orange', dotColor: '#f97316', bgLight: 'bg-orange-50', bgDark: 'dark:bg-orange-950/40', borderColor: 'border-orange-200 dark:border-orange-800', textColor: 'text-orange-800 dark:text-orange-300' },
  { id: 'teal', label: 'Teal', dotColor: '#14b8a6', bgLight: 'bg-teal-50', bgDark: 'dark:bg-teal-950/40', borderColor: 'border-teal-200 dark:border-teal-800', textColor: 'text-teal-800 dark:text-teal-300' },
  { id: 'rose', label: 'Rose', dotColor: '#f43f5e', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-950/40', borderColor: 'border-rose-200 dark:border-rose-800', textColor: 'text-rose-800 dark:text-rose-300' },
];

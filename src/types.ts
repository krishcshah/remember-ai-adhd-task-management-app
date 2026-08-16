export type RepeatType = 'none' | 'daily' | 'weekly' | 'weekly_on';

export interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
  colorClass: string;
  bgLight: string;
  bgDark: string;
  textColor: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'work', label: 'Work', emoji: '💼', colorClass: 'teal', bgLight: 'bg-teal-50', bgDark: 'dark:bg-teal-950/60', textColor: 'text-teal-800 dark:text-teal-300' },
  { id: 'personal', label: 'Personal', emoji: '🌱', colorClass: 'emerald', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-950/60', textColor: 'text-emerald-800 dark:text-emerald-300' },
  { id: 'health', label: 'Health', emoji: '💧', colorClass: 'blue', bgLight: 'bg-sky-50', bgDark: 'dark:bg-sky-950/60', textColor: 'text-sky-800 dark:text-sky-300' },
  { id: 'errands', label: 'Errands', emoji: '🛒', colorClass: 'amber', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-950/60', textColor: 'text-amber-800 dark:text-amber-300' },
  { id: 'study', label: 'Study', emoji: '📚', colorClass: 'indigo', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-950/60', textColor: 'text-indigo-800 dark:text-indigo-300' },
  { id: 'other', label: 'General', emoji: '✨', colorClass: 'stone', bgLight: 'bg-stone-100', bgDark: 'dark:bg-stone-800', textColor: 'text-stone-700 dark:text-stone-300' },
];

export function getCategoryInfo(categoryId?: string): CategoryOption {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (categoryId || '').toLowerCase());
  return found || CATEGORIES[5]; // Default to 'other'
}

export interface Subtask {
  id: string;
  title: string;
  estMinutes: number;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  category?: string;
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
  autoRolloverPending?: boolean; // Automatically roll over uncompleted tasks from past days to Today
  notificationsEnabled?: boolean; // Enable time-based task notifications (default true)
  notificationSound?: boolean; // Play gentle audio chime (default true)
}

export type ActiveTab = 'now' | 'calendar' | 'library' | 'settings' | 'you';



import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskCategory, Settings, ActiveTab, CategoryMeta, RepeatType, COLOR_PALETTES } from '../types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadActiveTaskId,
  saveActiveTaskId,
  loadCustomCategories,
  saveCustomCategories,
  getTodayDateString,
  getDefaultInitialTasks,
  getDefaultSettings,
  isTaskScheduledForDate,
  rollOverPastPendingTasks,
  sortTasksLogically,
} from '../utils/storage';
import { fallbackBreakdown, fallbackBrainDump, fallbackChatEdit, normalizeAiSubtasks } from '../utils/aiFallback';
import {
  directClientBreakdown,
  directClientBrainDump,
  directClientChatEdit,
  directClientTest,
  hasClientApiKey,
  getCustomClientApiKey,
  setCustomClientApiKey,
} from '../lib/geminiClient';
import {
  syncTasksToCloud,
  syncTaskDeletionToCloud,
  clearAllTasksFromCloud,
  syncSettingsToCloud,
  syncCategoriesToCloud,
  fetchAllTasksFromCloud,
  auth,
  googleProvider,
} from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface TaskContextType {
  tasks: Task[];
  settings: Settings;
  categories: Record<string, CategoryMeta>;
  currentTab: ActiveTab;
  activeTask: Task | null;
  focusTask: Task | null;
  isCaptureOpen: boolean;
  captureInitialTab: 'quick' | 'braindump';
  isEditOpen: boolean;
  editingTask: Task | null;
  isRepeatOpen: boolean;
  repeatTargetTask: Task | null;
  isAddCategoryOpen: boolean;
  aiLoading: boolean;
  aiError: string | null;
  theme: 'light' | 'dark' | 'system';
  
  // Cloud Auth & Sync Status
  user: User | null;
  isCloudSyncing: boolean;
  cloudLastSynced: Date | null;
  authError: { code: string; message: string; domain?: string } | null;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  clearAuthError: () => void;
  manualCloudSync: () => Promise<void>;

  // Navigation & Overlays
  setCurrentTab: (tab: ActiveTab) => void;
  openCapture: (tab?: 'quick' | 'braindump') => void;
  closeCapture: () => void;
  openEdit: (task: Task) => void;
  closeEdit: () => void;
  openRepeatModal: (task: Task) => void;
  closeRepeatModal: () => void;
  openAddCategoryModal: () => void;
  closeAddCategoryModal: () => void;
  startFocus: (task: Task) => void;
  closeFocus: () => void;
  stopFocus: () => void;
  setActiveTaskId: (id: string | null) => void;

  // Task Mutations
  addTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => Task;
  addMultipleTasks: (tasksData: Omit<Task, 'id' | 'createdAt'>[]) => Task[];
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  setTaskDone: (taskId: string, done: boolean) => void;
  scheduleTaskForToday: (taskId: string) => void;
  scheduleTaskForDate: (taskId: string, date: string | null) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  
  // Category Management
  addCategory: (label: string, paletteId?: string) => CategoryMeta;
  deleteCategory: (id: string) => void;

  // AI Operations
  requestBreakdown: (
    title: string,
    difficulty?: 1 | 2 | 3,
    notes?: string,
    category?: TaskCategory,
    existingSubtasks?: Array<{ title: string; estimatedMinutes?: number; estMinutes?: number }>
  ) => Promise<{
    title?: string;
    category: TaskCategory;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    repeatType?: RepeatType;
    repeatDays?: number[];
    granularity?: 1 | 2 | 3;
    estimatedMinutes: number;
    subtasks: { title: string; estimatedMinutes: number }[];
    isAiGenerated?: boolean;
  }>;
  requestBrainDump: (
    text: string
  ) => Promise<Array<{ title: string; category: TaskCategory; scheduledDate?: string | null; scheduledTime?: string | null; estimatedMinutes: number; subtasks?: { title: string; estimatedMinutes: number }[]; isAiGenerated?: boolean }>>;
  requestChatEdit: (
    task: Task,
    instruction: string
  ) => Promise<{ title: string; category: TaskCategory; estimatedMinutes: number; subtasks: { title: string; estimatedMinutes: number }[]; isAiGenerated?: boolean }>;
  testAiConnection: () => Promise<{ ok: boolean; model?: string; latencyMs?: number; error?: string }>;

  // Backup & Reset
  resetAllData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const raw = loadTasksFromStorage();
    const loadedSettings = loadSettingsFromStorage();
    if (loadedSettings.autoRolloverPending !== false) {
      const { updatedTasks } = rollOverPastPendingTasks(raw);
      return updatedTasks;
    }
    return raw;
  });
  const [settings, setSettings] = useState<Settings>(() => loadSettingsFromStorage());
  const [categories, setCategories] = useState<Record<string, CategoryMeta>>(() => loadCustomCategories());
  const [currentTab, setCurrentTab] = useState<ActiveTab>('calendar');
  const [activeTaskId, setActiveTaskIdState] = useState<string | null>(() => loadActiveTaskId());
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<{ code: string; message: string; domain?: string } | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudLastSynced, setCloudLastSynced] = useState<Date | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureInitialTab, setCaptureInitialTab] = useState<'quick' | 'braindump'>('quick');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isRepeatOpen, setIsRepeatOpen] = useState(false);
  const [repeatTargetTask, setRepeatTargetTask] = useState<Task | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch cloud data and merge without overwriting local changes
        setIsCloudSyncing(true);
        try {
          const cloudTasks = await fetchAllTasksFromCloud(currentUser.uid);
          if (cloudTasks.length > 0) {
            setTasks((localPrev) => {
              const taskMap = new Map<string, Task>();
              // 1. Put cloud tasks
              cloudTasks.forEach((ct) => taskMap.set(ct.id, ct));
              // 2. Merge local tasks
              localPrev.forEach((lt) => {
                if (!taskMap.has(lt.id)) {
                  taskMap.set(lt.id, lt);
                } else {
                  const cloudTask = taskMap.get(lt.id)!;
                  const localTime = lt.createdAt || '';
                  const cloudTime = cloudTask.createdAt || '';
                  if (localTime >= cloudTime) {
                    taskMap.set(lt.id, { ...cloudTask, ...lt });
                  }
                }
              });
              let merged = Array.from(taskMap.values());
              if (settings.autoRolloverPending !== false) {
                const { updatedTasks } = rollOverPastPendingTasks(merged);
                merged = updatedTasks;
              }
              const sorted = sortTasksLogically(merged);
              saveTasksToStorage(sorted);
              syncTasksToCloud(currentUser.uid, sorted);
              return sorted;
            });
          } else {
            // First time cloud user: sync existing local tasks up to their new cloud account
            await syncTasksToCloud(currentUser.uid, tasks);
          }
          setCloudLastSynced(new Date());
        } catch (e) {
          console.warn('Initial cloud fetch warning:', e);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    });
    return () => unsubscribe();
  }, [settings.autoRolloverPending]);

  // Periodic and on-toggle rollover effect
  useEffect(() => {
    if (settings.autoRolloverPending !== false) {
      setTasks((prev) => {
        const { updatedTasks, rolledCount } = rollOverPastPendingTasks(prev);
        if (rolledCount > 0) {
          return updatedTasks;
        }
        return prev;
      });
    }
  }, [settings.autoRolloverPending]);

  // Sync tasks to local storage & cloud database
  useEffect(() => {
    saveTasksToStorage(tasks);

    // Debounced sync to Firestore
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      setIsCloudSyncing(true);
      try {
        await syncTasksToCloud(user ? user.uid : null, tasks);
        setCloudLastSynced(new Date());
      } catch (err) {
        console.warn('Cloud sync debounce error:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 1200);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [tasks, user]);

  // Sync categories to local storage & cloud
  useEffect(() => {
    saveCustomCategories(categories);
    syncCategoriesToCloud(user ? user.uid : null, categories);
  }, [categories, user]);

  // Sync settings to local storage & cloud
  useEffect(() => {
    saveSettingsToStorage(settings);
    syncSettingsToCloud(user ? user.uid : null, settings);
    
    // Apply theme
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (settings.theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings, user]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const code = err?.code || 'auth/unknown';
      const domain = typeof window !== 'undefined' ? window.location.hostname : '';
      
      if (code === 'auth/unauthorized-domain') {
        setAuthError({
          code,
          domain,
          message: `The domain "${domain}" is not yet authorized in your Firebase Project. Add it to Firebase Console > Authentication > Settings > Authorized domains.`,
        });
      } else if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        setAuthError({
          code,
          domain,
          message: `The sign-in popup was blocked by your browser or iframe security policy. Please click "Open in New Tab" to sign in directly.`,
        });
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError({
          code,
          domain,
          message: `Sign-in was cancelled before completion.`,
        });
      } else {
        setAuthError({
          code,
          domain,
          message: err?.message || 'Failed to complete Google Sign-In. Please check your network and Firebase configuration.',
        });
      }
    }
  }, []);

  const logOut = useCallback(async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-Out failed:', err);
    }
  }, []);

  const manualCloudSync = useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      await syncTasksToCloud(user ? user.uid : null, tasks);
      await syncSettingsToCloud(user ? user.uid : null, settings);
      await syncCategoriesToCloud(user ? user.uid : null, categories);
      setCloudLastSynced(new Date());
    } finally {
      setIsCloudSyncing(false);
    }
  }, [user, tasks, settings, categories]);

  const setActiveTaskId = useCallback((id: string | null) => {
    setActiveTaskIdState(id);
    saveActiveTaskId(id);
  }, []);

  // Compute active task for Now screen
  const todayStr = getTodayDateString();
  const activeTask = React.useMemo(() => {
    if (activeTaskId) {
      const found = tasks.find((t) => t.id === activeTaskId && t.status === 'todo');
      if (found) return found;
    }
    // Fallback: First task scheduled for today (or repeating today) that is not done
    const todayTasks = tasks.filter((t) => isTaskScheduledForDate(t, todayStr) && t.status === 'todo');
    if (todayTasks.length > 0) {
      return todayTasks[0];
    }
    // Next fallback: Any todo task
    const anyTodo = tasks.find((t) => t.status === 'todo');
    return anyTodo || null;
  }, [tasks, activeTaskId, todayStr]);

  const openCapture = useCallback((tab: 'quick' | 'braindump' = 'quick') => {
    setCaptureInitialTab(tab);
    setIsCaptureOpen(true);
  }, []);

  const closeCapture = useCallback(() => {
    setIsCaptureOpen(false);
  }, []);

  const openEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setIsEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setIsEditOpen(false);
  }, []);

  const openRepeatModal = useCallback((task: Task) => {
    setRepeatTargetTask(task);
    setIsRepeatOpen(true);
  }, []);

  const closeRepeatModal = useCallback(() => {
    setIsRepeatOpen(false);
  }, []);

  const openAddCategoryModal = useCallback(() => {
    setIsAddCategoryOpen(true);
  }, []);

  const closeAddCategoryModal = useCallback(() => {
    setIsAddCategoryOpen(false);
  }, []);

  const startFocus = useCallback((task: Task) => {
    setFocusTask(task);
    setActiveTaskId(task.id);
  }, [setActiveTaskId]);

  const closeFocus = useCallback(() => {
    setFocusTask(null);
  }, []);

  const stopFocus = useCallback(() => {
    setFocusTask(null);
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const next = sortTasksLogically([newTask, ...prev]);
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
    if ((newTask.scheduledDate === getTodayDateString() || newTask.repeatDaily || newTask.repeatType === 'daily') && !activeTaskId) {
      setActiveTaskId(newTask.id);
    }
    return newTask;
  }, [activeTaskId, setActiveTaskId, user]);

  const addMultipleTasks = useCallback((tasksData: Omit<Task, 'id' | 'createdAt'>[]): Task[] => {
    if (!Array.isArray(tasksData) || tasksData.length === 0) return [];
    
    const now = Date.now();
    const newTasks: Task[] = tasksData
      .filter((td) => td && typeof td === 'object' && String(td.title || '').trim().length > 0)
      .map((td, idx) => {
        const cleanTitle = String(td.title || '').trim();
        const validCategory = (td.category as TaskCategory) || 'other';
        const validEstMins = Math.max(1, Number(td.estMinutes) || 15);
        const validSubtasks = Array.isArray(td.subtasks)
          ? td.subtasks.map((st, sidx) => ({
              id: st.id || `sub-${now}-${idx}-${sidx}`,
              title: String(st.title || `Step ${sidx + 1}`),
              estMinutes: Math.max(1, Number(st.estMinutes) || 5),
              done: Boolean(st.done),
            }))
          : [];

        return {
          id: 'task-' + (now + idx) + '-' + Math.random().toString(36).substr(2, 5),
          title: cleanTitle,
          category: validCategory,
          estMinutes: validEstMins,
          subtasks: validSubtasks,
          scheduledDate: td.scheduledDate || null,
          scheduledTime: td.scheduledTime || null,
          status: 'todo' as const,
          repeatDaily: Boolean(td.repeatDaily),
          repeatType: td.repeatType || (td.repeatDaily ? 'daily' : 'none'),
          repeatDays: Array.isArray(td.repeatDays) ? td.repeatDays : undefined,
          notes: td.notes || undefined,
          createdAt: new Date().toISOString(),
        };
      });

    if (newTasks.length === 0) return [];

    setTasks((prev) => {
      const next = sortTasksLogically([...newTasks, ...prev]);
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
    return newTasks;
  }, [user]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const next = sortTasksLogically(
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
  }, [user]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTasksToStorage(next);
      return next;
    });
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
    if (focusTask?.id === id) {
      setFocusTask(null);
    }
    syncTaskDeletionToCloud(user ? user.uid : null, id);
  }, [activeTaskId, focusTask, setActiveTaskId, user]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) => {
      const next: Task[] = prev.map((t) => {
        if (t.id !== taskId) return t;
        const newSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        );
        const allDone = newSubtasks.length > 0 && newSubtasks.every((s) => s.done);
        return {
          ...t,
          subtasks: newSubtasks,
          status: allDone ? ('done' as const) : ('todo' as const),
          completedAt: allDone ? (t.completedAt || new Date().toISOString()) : null,
        };
      });
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
  }, [user]);

  const setTaskDone = useCallback((taskId: string, done: boolean) => {
    setTasks((prev) => {
      const next: Task[] = prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: done ? ('done' as const) : ('todo' as const),
          completedAt: done ? new Date().toISOString() : null,
          subtasks: t.subtasks.map((s) => ({ ...s, done })),
        };
      });
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
  }, [user]);

  const scheduleTaskForToday = useCallback((taskId: string) => {
    const today = getTodayDateString();
    setTasks((prev) => {
      const next = sortTasksLogically(
        prev.map((t) =>
          t.id === taskId ? { ...t, scheduledDate: today, status: 'todo' } : t
        )
      );
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
    setActiveTaskId(taskId);
  }, [setActiveTaskId, user]);

  const scheduleTaskForDate = useCallback((taskId: string, date: string | null) => {
    setTasks((prev) => {
      const next = sortTasksLogically(
        prev.map((t) =>
          t.id === taskId ? { ...t, scheduledDate: date } : t
        )
      );
      saveTasksToStorage(next);
      syncTasksToCloud(user ? user.uid : null, next);
      return next;
    });
  }, [user]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const addCategory = useCallback((label: string, paletteId?: string): CategoryMeta => {
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_') || `cat_${Date.now()}`;
    const pal = COLOR_PALETTES.find((p) => p.id === paletteId) || COLOR_PALETTES[0];
    const newCategory: CategoryMeta = {
      id,
      label,
      color: `bg-${pal.id}-600`,
      borderColor: pal.borderColor,
      dotColor: pal.dotColor,
      textColor: pal.textColor,
      bgLight: pal.bgLight,
      bgDark: pal.bgDark,
    };

    setCategories((prev) => ({ ...prev, [id]: newCategory }));
    return newCategory;
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  // AI API with seamless multi-tier execution (Server / Vercel Serverless / Direct Client / Offline)
  const requestBreakdown = useCallback(
    async (
      title: string,
      difficulty?: 1 | 2 | 3,
      notes?: string,
      category?: TaskCategory,
      existingSubtasks?: Array<{ title: string; estimatedMinutes?: number; estMinutes?: number }>
    ) => {
      setAiLoading(true);
      setAiError(null);
      const todayIso = getTodayDateString();
      
      try {
        // Tier 1: Try Server or Serverless API
        try {
          const res = await fetch('/api/ai/breakdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              difficulty: difficulty || settings.difficulty || 1,
              notes,
              category,
              currentDate: todayIso,
              context: settings.context,
              availableCategories: Object.keys(categories),
              existingSubtasks,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data && (data.title || data.subtasks || data.tasks)) {
              const cleanTitle = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : undefined;
              const cleanSubtasks = normalizeAiSubtasks(data.subtasks || data.tasks, cleanTitle || title);
              return {
                title: cleanTitle,
                category: (data.category as TaskCategory) || category || 'other',
                scheduledDate: typeof data.scheduledDate === 'string' && data.scheduledDate.trim() ? data.scheduledDate.trim() : (data.scheduledDate === null ? null : undefined),
                scheduledTime: typeof data.scheduledTime === 'string' && data.scheduledTime.trim() ? data.scheduledTime.trim() : (data.scheduledTime === null ? null : undefined),
                repeatType: (data.repeatType as RepeatType) || 'none',
                repeatDays: Array.isArray(data.repeatDays) ? data.repeatDays : undefined,
                granularity: (data.granularity as (1 | 2 | 3)) || difficulty || 1,
                estimatedMinutes: Number(data.estimatedMinutes) || cleanSubtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0) || 15,
                subtasks: cleanSubtasks,
                isAiGenerated: true,
              };
            }
          }
        } catch (err) {
          console.warn('Server breakdown call failed, checking direct client key...', err);
        }

        // Tier 2: Try Direct Client-Side Gemini (e.g. Vercel Static deployment with key)
        if (hasClientApiKey()) {
          try {
            const clientData = await directClientBreakdown({
              title,
              notes,
              category,
              currentDate: todayIso,
              context: settings.context,
              availableCategories: Object.keys(categories),
              existingSubtasks,
            });
            if (clientData && (clientData.title || clientData.subtasks || clientData.tasks)) {
              const cleanTitle = typeof clientData.title === 'string' && clientData.title.trim() ? clientData.title.trim() : undefined;
              const cleanSubtasks = normalizeAiSubtasks(clientData.subtasks || clientData.tasks, cleanTitle || title);
              return {
                title: cleanTitle,
                category: (clientData.category as TaskCategory) || category || 'other',
                scheduledDate: typeof clientData.scheduledDate === 'string' && clientData.scheduledDate.trim() ? clientData.scheduledDate.trim() : (clientData.scheduledDate === null ? null : undefined),
                scheduledTime: typeof clientData.scheduledTime === 'string' && clientData.scheduledTime.trim() ? clientData.scheduledTime.trim() : (clientData.scheduledTime === null ? null : undefined),
                repeatType: (clientData.repeatType as RepeatType) || 'none',
                repeatDays: Array.isArray(clientData.repeatDays) ? clientData.repeatDays : undefined,
                granularity: (clientData.granularity as (1 | 2 | 3)) || difficulty || 1,
                estimatedMinutes: Number(clientData.estimatedMinutes) || cleanSubtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0) || 15,
                subtasks: cleanSubtasks,
                isAiGenerated: true,
              };
            }
          } catch (clientErr: any) {
            console.warn('Direct client Gemini failed:', clientErr);
            setAiError(clientErr?.message || 'Direct client Gemini failed');
          }
        }

        // Tier 3: Intelligent offline rule-based fallback
        const fb = fallbackBreakdown(title, difficulty, notes, category, existingSubtasks, todayIso);
        return { ...fb, isAiGenerated: false };
      } finally {
        setAiLoading(false);
      }
    },
    [settings.difficulty, settings.context, categories]
  );

  const requestBrainDump = useCallback(
    async (text: string) => {
      setAiLoading(true);
      setAiError(null);
      const todayIso = getTodayDateString();
      
      try {
        // Tier 1: Try Server / Serverless API
        try {
          const res = await fetch('/api/ai/braindump', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              currentDate: todayIso,
              context: settings.context,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rawTasks = Array.isArray(data.tasks) ? data.tasks : Array.isArray(data) ? data : [];
            if (rawTasks.length > 0) {
              return rawTasks.map((t: any) => {
                const cleanTitle = typeof t.title === 'string' ? t.title : String(t.name || t.text || t || '');
                const cleanSubtasks = t.subtasks ? normalizeAiSubtasks(t.subtasks, cleanTitle) : undefined;
                return {
                  title: cleanTitle,
                  category: (t.category as TaskCategory) || 'other',
                  scheduledDate: typeof t.scheduledDate === 'string' && t.scheduledDate.trim() ? t.scheduledDate.trim() : (t.scheduledDate === null ? null : undefined),
                  scheduledTime: typeof t.scheduledTime === 'string' && t.scheduledTime.trim() ? t.scheduledTime.trim() : (t.scheduledTime === null ? null : undefined),
                  estimatedMinutes: Number(t.estimatedMinutes || t.estMinutes) || 15,
                  subtasks: cleanSubtasks,
                  isAiGenerated: true,
                };
              });
            }
          }
        } catch (err) {
          console.warn('Server brain dump call failed, checking direct client key...', err);
        }

        // Tier 2: Try Direct Client-Side Gemini
        if (hasClientApiKey()) {
          try {
            const clientData = await directClientBrainDump({
              text,
              currentDate: todayIso,
              context: settings.context,
            });
            const rawTasks = clientData && Array.isArray(clientData.tasks) ? clientData.tasks : Array.isArray(clientData) ? clientData : [];
            if (rawTasks.length > 0) {
              return rawTasks.map((t: any) => {
                const cleanTitle = typeof t.title === 'string' ? t.title : String(t.name || t.text || t || '');
                const cleanSubtasks = t.subtasks ? normalizeAiSubtasks(t.subtasks, cleanTitle) : undefined;
                return {
                  title: cleanTitle,
                  category: (t.category as TaskCategory) || 'other',
                  scheduledDate: typeof t.scheduledDate === 'string' && t.scheduledDate.trim() ? t.scheduledDate.trim() : (t.scheduledDate === null ? null : undefined),
                  scheduledTime: typeof t.scheduledTime === 'string' && t.scheduledTime.trim() ? t.scheduledTime.trim() : (t.scheduledTime === null ? null : undefined),
                  estimatedMinutes: Number(t.estimatedMinutes || t.estMinutes) || 15,
                  subtasks: cleanSubtasks,
                  isAiGenerated: true,
                };
              });
            }
          } catch (clientErr: any) {
            console.warn('Direct client BrainDump failed:', clientErr);
            setAiError(clientErr?.message || 'Direct client AI failed');
          }
        }

        // Tier 3: Intelligent offline fallback
        return fallbackBrainDump(text, todayIso).map((t) => ({ ...t, isAiGenerated: false }));
      } finally {
        setAiLoading(false);
      }
    },
    [settings.context]
  );

  const requestChatEdit = useCallback(
    async (task: Task, instruction: string) => {
      setAiLoading(true);
      setAiError(null);
      
      try {
        // Tier 1: Try Server / Serverless API
        try {
          const res = await fetch('/api/ai/chat-edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task,
              instruction,
              context: settings.context,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const cleanTitle = String(data.title || data.name || task.title);
            const cleanSubtasks = normalizeAiSubtasks(
              data.subtasks || data.tasks || data.steps,
              cleanTitle
            );
            return {
              title: cleanTitle,
              category: (data.category as TaskCategory) || task.category,
              estimatedMinutes: Number(data.estimatedMinutes || data.estMinutes) || task.estMinutes,
              subtasks: cleanSubtasks.length > 0 ? cleanSubtasks : task.subtasks.map((s) => ({ title: s.title, estimatedMinutes: s.estMinutes })),
              isAiGenerated: true,
            };
          }
        } catch (err) {
          console.warn('Server chat edit call failed, checking direct client key...', err);
        }

        // Tier 2: Try Direct Client-Side Gemini
        if (hasClientApiKey()) {
          try {
            const clientData = await directClientChatEdit({
              task,
              instruction,
              context: settings.context,
            });
            if (clientData) {
              const cleanTitle = String(clientData.title || clientData.name || task.title);
              const cleanSubtasks = normalizeAiSubtasks(
                clientData.subtasks || clientData.tasks || clientData.steps,
                cleanTitle
              );
              return {
                title: cleanTitle,
                category: (clientData.category as TaskCategory) || task.category,
                estimatedMinutes: Number(clientData.estimatedMinutes || clientData.estMinutes) || task.estMinutes,
                subtasks: cleanSubtasks.length > 0 ? cleanSubtasks : task.subtasks.map((s) => ({ title: s.title, estimatedMinutes: s.estMinutes })),
                isAiGenerated: true,
              };
            }
          } catch (clientErr: any) {
            console.warn('Direct client ChatEdit failed:', clientErr);
            setAiError(clientErr?.message || 'Direct client AI failed');
          }
        }

        // Tier 3: Intelligent offline fallback
        const fb = fallbackChatEdit(task, instruction);
        return { ...fb, isAiGenerated: false };
      } finally {
        setAiLoading(false);
      }
    },
    [settings.context]
  );

  const testAiConnection = useCallback(async (customKeyOverride?: string) => {
    // If a custom key override is passed, test client-side directly
    if (customKeyOverride) {
      return await directClientTest(customKeyOverride);
    }

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      
      // If server failed, try direct client if key exists
      if (hasClientApiKey()) {
        return await directClientTest();
      }

      return {
        ok: false,
        error: errData.error || `Server status ${res.status}`,
      };
    } catch (err: any) {
      if (hasClientApiKey()) {
        return await directClientTest();
      }
      return {
        ok: false,
        error: err?.message || 'Failed to connect to backend server / Vercel API',
      };
    }
  }, []);

  const resetAllData = useCallback(async () => {
    const sample = getDefaultInitialTasks();
    const defSettings = getDefaultSettings();
    setTasks(sample);
    setSettings(defSettings);
    saveTasksToStorage(sample);
    saveSettingsToStorage(defSettings);
    setActiveTaskId('task-1');
    setFocusTask(null);
    try {
      await syncTasksToCloud(user ? user.uid : null, sample);
      await syncSettingsToCloud(user ? user.uid : null, defSettings);
      setCloudLastSynced(new Date());
    } catch (err) {
      console.warn('Cloud reset error:', err);
    }
  }, [setActiveTaskId, user]);

  const clearAllData = useCallback(async () => {
    setTasks([]);
    saveTasksToStorage([]);
    setActiveTaskId(null);
    setFocusTask(null);
    try {
      await clearAllTasksFromCloud(user ? user.uid : null);
      setCloudLastSynced(new Date());
    } catch (err) {
      console.warn('Cloud clear error:', err);
    }
  }, [setActiveTaskId, user]);

  const exportDataJSON = useCallback((): string => {
    const data = {
      app: 'Remember',
      version: 2,
      exportDate: new Date().toISOString(),
      tasks,
      categories,
      settings,
    };
    return JSON.stringify(data, null, 2);
  }, [tasks, categories, settings]);

  const importDataJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        setTasks(parsed.tasks);
        if (parsed.categories) {
          setCategories((prev) => ({ ...prev, ...parsed.categories }));
        }
        if (parsed.settings) {
          setSettings({ ...getDefaultSettings(), ...parsed.settings });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        settings,
        categories,
        currentTab,
        activeTask,
        focusTask,
        isCaptureOpen,
        captureInitialTab,
        isEditOpen,
        editingTask,
        isRepeatOpen,
        repeatTargetTask,
        isAddCategoryOpen,
        aiLoading,
        aiError,
        theme: settings.theme,
        user,
        authError,
        isCloudSyncing,
        cloudLastSynced,
        signInWithGoogle,
        logOut,
        clearAuthError,
        manualCloudSync,
        setCurrentTab,
        openCapture,
        closeCapture,
        openEdit,
        closeEdit,
        openRepeatModal,
        closeRepeatModal,
        openAddCategoryModal,
        closeAddCategoryModal,
        startFocus,
        closeFocus,
        stopFocus,
        setActiveTaskId,
        addTask,
        addMultipleTasks,
        updateTask,
        deleteTask,
        toggleSubtask,
        setTaskDone,
        scheduleTaskForToday,
        scheduleTaskForDate,
        updateSettings,
        addCategory,
        deleteCategory,
        requestBreakdown,
        requestBrainDump,
        requestChatEdit,
        testAiConnection,
        resetAllData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}

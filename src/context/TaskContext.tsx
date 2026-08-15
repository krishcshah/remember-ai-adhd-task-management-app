import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, TaskCategory, Settings, ActiveTab } from '../types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadActiveTaskId,
  saveActiveTaskId,
  getTodayDateString,
  getDefaultInitialTasks,
  getDefaultSettings,
} from '../utils/storage';
import { fallbackBreakdown, fallbackBrainDump, fallbackChatEdit } from '../utils/aiFallback';

interface TaskContextType {
  tasks: Task[];
  settings: Settings;
  currentTab: ActiveTab;
  activeTask: Task | null;
  focusTask: Task | null;
  isCaptureOpen: boolean;
  captureInitialTab: 'quick' | 'braindump';
  isEditOpen: boolean;
  editingTask: Task | null;
  aiLoading: boolean;
  aiError: string | null;
  theme: 'light' | 'dark' | 'system';
  
  // Navigation & Overlays
  setCurrentTab: (tab: ActiveTab) => void;
  openCapture: (tab?: 'quick' | 'braindump') => void;
  closeCapture: () => void;
  openEdit: (task: Task) => void;
  closeEdit: () => void;
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

  // AI Operations
  requestBreakdown: (
    title: string,
    difficulty?: 1 | 2 | 3,
    notes?: string,
    category?: TaskCategory
  ) => Promise<{ category: TaskCategory; estimatedMinutes: number; subtasks: { title: string; estimatedMinutes: number }[] }>;
  requestBrainDump: (
    text: string
  ) => Promise<Array<{ title: string; category: TaskCategory; estimatedMinutes: number; subtasks?: { title: string; estimatedMinutes: number }[] }>>;
  requestChatEdit: (
    task: Task,
    instruction: string
  ) => Promise<{ title: string; category: TaskCategory; estimatedMinutes: number; subtasks: { title: string; estimatedMinutes: number }[] }>;

  // Backup & Reset
  resetAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [settings, setSettings] = useState<Settings>(() => loadSettingsFromStorage());
  const [currentTab, setCurrentTab] = useState<ActiveTab>('now');
  const [activeTaskId, setActiveTaskIdState] = useState<string | null>(() => loadActiveTaskId());
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureInitialTab, setCaptureInitialTab] = useState<'quick' | 'braindump'>('quick');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync tasks to local storage
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // Sync settings to local storage & DOM theme
  useEffect(() => {
    saveSettingsToStorage(settings);
    
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
  }, [settings]);

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
    // Fallback: First task scheduled for today (or repeating daily) that is not done
    const todayTasks = tasks.filter((t) => (t.repeatDaily || t.scheduledDate === todayStr) && t.status === 'todo');
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
    setEditingTask(null);
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
    setTasks((prev) => [newTask, ...prev]);
    if ((newTask.scheduledDate === getTodayDateString() || newTask.repeatDaily) && !activeTaskId) {
      setActiveTaskId(newTask.id);
    }
    return newTask;
  }, [activeTaskId, setActiveTaskId]);

  const addMultipleTasks = useCallback((tasksData: Omit<Task, 'id' | 'createdAt'>[]): Task[] => {
    const newTasks = tasksData.map((td, idx) => ({
      ...td,
      id: 'task-' + (Date.now() + idx) + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    }));
    setTasks((prev) => [...newTasks, ...prev]);
    return newTasks;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
    if (focusTask?.id === id) {
      setFocusTask(null);
    }
  }, [activeTaskId, focusTask, setActiveTaskId]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newSubtasks = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        );
        const allDone = newSubtasks.length > 0 && newSubtasks.every((s) => s.done);
        return {
          ...t,
          subtasks: newSubtasks,
          status: allDone ? 'done' : 'todo',
          completedAt: allDone ? (t.completedAt || new Date().toISOString()) : null,
        };
      })
    );
  }, []);

  const setTaskDone = useCallback((taskId: string, done: boolean) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: done ? 'done' : 'todo',
          completedAt: done ? new Date().toISOString() : null,
          subtasks: t.subtasks.map((s) => ({ ...s, done })),
        };
      })
    );
  }, []);

  const scheduleTaskForToday = useCallback((taskId: string) => {
    const today = getTodayDateString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, scheduledDate: today, status: 'todo' } : t
      )
    );
    setActiveTaskId(taskId);
  }, [setActiveTaskId]);

  const scheduleTaskForDate = useCallback((taskId: string, date: string | null) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, scheduledDate: date } : t
      )
    );
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // AI API with seamless Fallback
  const requestBreakdown = useCallback(
    async (
      title: string,
      difficulty: 1 | 2 | 3 = settings.difficulty,
      notes?: string,
      category?: TaskCategory
    ) => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetch('/api/ai/breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            difficulty,
            notes,
            category,
            context: settings.context,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        return {
          category: (data.category as TaskCategory) || category || 'other',
          estimatedMinutes: Number(data.estimatedMinutes) || 20,
          subtasks: Array.isArray(data.subtasks)
            ? data.subtasks.map((s: any) => ({
                title: String(s.title),
                estimatedMinutes: Number(s.estimatedMinutes) || 5,
              }))
            : [],
        };
      } catch (err: any) {
        console.warn('AI Breakdown API failed, using intelligent offline fallback:', err);
        return fallbackBreakdown(title, difficulty, notes, category);
      } finally {
        setAiLoading(false);
      }
    },
    [settings.difficulty, settings.context]
  );

  const requestBrainDump = useCallback(
    async (text: string) => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetch('/api/ai/braindump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            context: settings.context,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        if (Array.isArray(data.tasks) && data.tasks.length > 0) {
          return data.tasks.map((t: any) => ({
            title: String(t.title),
            category: (t.category as TaskCategory) || 'other',
            estimatedMinutes: Number(t.estimatedMinutes) || 15,
            subtasks: Array.isArray(t.subtasks)
              ? t.subtasks.map((s: any) => ({
                  title: String(s.title),
                  estimatedMinutes: Number(s.estimatedMinutes) || 5,
                }))
              : undefined,
          }));
        }
        return fallbackBrainDump(text);
      } catch (err: any) {
        console.warn('AI BrainDump API failed, using offline fallback:', err);
        return fallbackBrainDump(text);
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
        const res = await fetch('/api/ai/chat-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task,
            instruction,
            context: settings.context,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server status ${res.status}`);
        }

        const data = await res.json();
        return {
          title: String(data.title || task.title),
          category: (data.category as TaskCategory) || task.category,
          estimatedMinutes: Number(data.estimatedMinutes) || task.estMinutes,
          subtasks: Array.isArray(data.subtasks)
            ? data.subtasks.map((s: any) => ({
                title: String(s.title),
                estimatedMinutes: Number(s.estimatedMinutes) || 5,
              }))
            : task.subtasks.map((s) => ({ title: s.title, estimatedMinutes: s.estMinutes })),
        };
      } catch (err: any) {
        console.warn('AI ChatEdit API failed, using offline fallback:', err);
        return fallbackChatEdit(task, instruction);
      } finally {
        setAiLoading(false);
      }
    },
    [settings.context]
  );

  const resetAllData = useCallback(() => {
    const sample = getDefaultInitialTasks();
    const defSettings = getDefaultSettings();
    setTasks(sample);
    setSettings(defSettings);
    setActiveTaskId('task-1');
    setFocusTask(null);
  }, [setActiveTaskId]);

  const exportDataJSON = useCallback((): string => {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      tasks,
      settings,
    };
    return JSON.stringify(data, null, 2);
  }, [tasks, settings]);

  const importDataJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        setTasks(parsed.tasks);
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
        currentTab,
        activeTask,
        focusTask,
        isCaptureOpen,
        captureInitialTab,
        isEditOpen,
        editingTask,
        aiLoading,
        aiError,
        theme: settings.theme,
        setCurrentTab,
        openCapture,
        closeCapture,
        openEdit,
        closeEdit,
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
        requestBreakdown,
        requestBrainDump,
        requestChatEdit,
        resetAllData,
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

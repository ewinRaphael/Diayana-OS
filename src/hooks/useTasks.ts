// ============================================================
// NexusOS — useTasks hook
// CRUD operations for Task records with workspace filtering
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority, Workspace } from '../lib/types';
import type { TaskFilter } from '../lib/localStore';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

export const TASKS_CHANGED_EVENT = 'nexus-tasks-changed';

export function notifyTasksChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT));
  }
}

interface UseTasksOptions {
  workspace?: Workspace;
  status?: TaskStatus;
  priority?: TaskPriority;
  date?: string;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export function useTasks(options: UseTasksOptions = {}) {
  const { store } = useDatabase();
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const buildFilter = useCallback((): TaskFilter => {
    const filter: TaskFilter = {};

    const ws = options.workspace ?? (activeWorkspace !== 'all' ? activeWorkspace : undefined);
    if (ws) filter.workspace = ws;
    if (options.status) filter.status = options.status;
    if (options.priority) filter.priority = options.priority;
    if (options.date) filter.date = options.date;

    return filter;
  }, [options.workspace, options.status, options.priority, options.date, activeWorkspace]);

  const refreshTasks = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const result = await store.getTasks(buildFilter());
      if (mountedRef.current) {
        setTasks(result);
      }
    } catch (err) {
      console.error('[useTasks] Failed to fetch tasks:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store, buildFilter]);

  useEffect(() => {
    mountedRef.current = true;
    refreshTasks();

    const handleTasksChanged = () => {
      refreshTasks();
    };

    window.addEventListener(TASKS_CHANGED_EVENT, handleTasksChanged);
    return () => {
      mountedRef.current = false;
      window.removeEventListener(TASKS_CHANGED_EVENT, handleTasksChanged);
    };
  }, [refreshTasks]);

  const createTask = useCallback(
    async (task: Omit<Task, 'id' | 'created_at' | 'notification_sent'>) => {
      if (!store) throw new Error('Database not ready');
      const created = await store.createTask(task);
      await refreshTasks();
      notifyTasksChanged();
      return created;
    },
    [store, refreshTasks],
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      if (!store) throw new Error('Database not ready');
      const updated = await store.updateTask(id, updates);
      await refreshTasks();
      notifyTasksChanged();
      return updated;
    },
    [store, refreshTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!store) throw new Error('Database not ready');
      await store.deleteTask(id);
      await refreshTasks();
      notifyTasksChanged();
    },
    [store, refreshTasks],
  );

  const toggleTaskStatus = useCallback(
    async (id: string) => {
      if (!store) throw new Error('Database not ready');
      const task = tasks.find((t) => t.id === id);
      if (!task) throw new Error(`Task ${id} not found in current list`);
      const nextStatus = STATUS_CYCLE[task.status];
      const updated = await store.updateTask(id, { status: nextStatus });
      await refreshTasks();
      notifyTasksChanged();
      return updated;
    },
    [store, tasks, refreshTasks],
  );

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
    toggleTaskStatus,
  } as const;
}

export default useTasks;

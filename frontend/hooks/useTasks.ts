'use client';

import { useState, useCallback, useRef } from 'react';
import { CreateTaskPayload, Task, TaskPriority, TaskStatus, UpdateTaskPayload } from '../types';
import { taskService } from '../services/taskService';

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<TaskMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const currentFiltersRef = useRef<TaskFilters>({});

  const fetchTasks = useCallback(async (filters: TaskFilters = {}) => {
    setLoading(true);
    setError(null);
    currentFiltersRef.current = filters;
    try {
      // Strip empty string values so backend doesn't receive empty filter params
      const cleanFilters: Record<string, any> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== '' && value !== undefined && value !== null) {
          cleanFilters[key] = value;
        }
      }
      const res = await taskService.getTasks(cleanFilters as any);
      setTasks(res.data || []);
      if (res.meta) {
        setMeta(res.meta as TaskMeta);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (payload: CreateTaskPayload) => {
    setError(null);
    try {
      const newTask = await taskService.createTask(payload);
      // Re-fetch to stay in sync with server-side pagination & ordering
      await fetchTasks(currentFiltersRef.current);
      return newTask;
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, payload: UpdateTaskPayload) => {
    setError(null);
    try {
      const updated = await taskService.updateTask(id, payload);
      setTasks((prev) => prev.map((t) => (t.id === id || t._id === id ? updated : t)));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    setError(null);
    try {
      await taskService.deleteTask(id);
      // After delete, re-fetch to respect pagination properly
      await fetchTasks(currentFiltersRef.current);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      throw err;
    }
  };

  return {
    tasks,
    meta,
    loading,
    error,
    setError,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};

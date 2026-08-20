import api from './api';
import { CreateTaskPayload, Task, TaskPriority, TaskStatus, UpdateTaskPayload } from '../types';

export const taskService = {
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ data: Task[]; meta?: any }> {
    const response: any = await api.get('/tasks', { params });
    if (response && response.data && Array.isArray(response.data)) {
      return { data: response.data, meta: response.meta };
    }
    if (Array.isArray(response)) {
      return { data: response };
    }
    return { data: [] };
  },

  async getTaskById(id: string): Promise<Task> {
    const response: any = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const response: any = await api.post('/tasks', payload);
    return response.data;
  },

  async updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
    const response: any = await api.patch(`/tasks/${id}`, payload);
    return response.data;
  },

  async deleteTask(id: string): Promise<{ id: string; success: boolean }> {
    const response: any = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

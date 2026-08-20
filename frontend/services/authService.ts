import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const response: any = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response: any = await api.post('/auth/login', data);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response: any = await api.get('/users/me');
    return response.data;
  },
};

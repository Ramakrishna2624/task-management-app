import api from './api';

export interface WeatherData {
  available: boolean;
  location?: string;
  temp?: number;
  feelsLike?: number;
  condition?: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
  humidity?: number;
  windSpeed?: number;
  message?: string;
}

export const weatherService = {
  async getTaskWeather(taskId: string): Promise<WeatherData> {
    try {
      const response: any = await api.get(`/tasks/${taskId}/weather`);
      return response.data || response;
    } catch (err: any) {
      return {
        available: false,
        message: 'Weather unavailable',
      };
    }
  },
};

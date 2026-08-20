import axios from 'axios';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://task-management-backend-56j7.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

export const api = axios.create({
  baseURL: 'https://task-management-backend-56j7.onrender.com/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token dynamically and set baseURL
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: extract data payload and handle 401 unauthorized cleanly
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

export default api;

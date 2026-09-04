import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: backendApiUrl,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NEXT_PUBLIC_API_KEY ? { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY } : {}),
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/session-expired') {
          window.location.href = '/session-expired';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

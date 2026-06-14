import axios, { AxiosError } from 'axios';
import { supabase } from './supabase';

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export const api = axios.create({
  baseURL: backendApiUrl,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NEXT_PUBLIC_API_KEY ? { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY } : {}),
  },
});

api.interceptors.request.use(async (config) => {
  if (!MOCK_MODE) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!MOCK_MODE && error.response?.status === 401) {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/session-expired') {
          window.location.href = '/session-expired';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

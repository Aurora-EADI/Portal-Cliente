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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Login failures and refresh failures must reach their callers without recursion.
    const isAuthRequest = /^\/auth\/(login|refresh)$/.test(originalRequest?.url || '');
    if (error.response?.status === 401 && originalRequest && !isAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      const refreshToken = Cookies.get('refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        Cookies.remove('access_token');
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/session-expired') {
            window.location.href = '/session-expired';
          }
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post('/auth/refresh', {
          refreshToken,
        });

        Cookies.set('access_token', data.token, { sameSite: 'lax', expires: 1 });
        Cookies.set('refresh_token', data.refreshToken, { sameSite: 'lax', expires: 7 });

        originalRequest.headers['Authorization'] = 'Bearer ' + data.token;

        processQueue(null, data.token);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Network/server failures do not prove the session has expired.
        const status = (err as AxiosError).response?.status;
        if (status !== 401 && status !== 403) return Promise.reject(err);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/session-expired') {
            window.location.href = '/session-expired';
          }
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

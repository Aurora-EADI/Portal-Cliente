import axios from 'axios';

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * -----------------------------
 * REQUEST INTERCEPTOR
 * Adiciona o Authorization Bearer
 * -----------------------------
 */
httpClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * -----------------------------
 * RESPONSE INTERCEPTOR
 * Trata 401 e redireciona logout
 * -----------------------------
 */
httpClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    // Se for 401 e NÃO for login, força logout
    if (status === 401) {
      const isLoginRequest = url.includes('/auth/login');

      if (!isLoginRequest && typeof window !== 'undefined') {
        localStorage.removeItem('auth_session');
        localStorage.removeItem('access_token');

        const currentPath = window.location.pathname;

        if (currentPath !== '/' && currentPath !== '/login') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;

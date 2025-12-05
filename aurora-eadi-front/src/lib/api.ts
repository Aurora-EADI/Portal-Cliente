import axios from 'axios';

// Instância principal do axios
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * -------------------------------
 * REQUEST INTERCEPTOR
 * Adiciona token quando existir
 * -------------------------------
 */
api.interceptors.request.use(
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
 * -------------------------------
 * RESPONSE INTERCEPTOR
 * Trata 401 e limpa sessão
 * -------------------------------
 */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // ⛔ Evita deslogar caso o erro seja na rota de login
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (status === 401 && !isLoginRequest) {
      if (typeof window !== 'undefined') {
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

export default api;
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { isTokenExpired } from './jwt-helper';
import {
  getAccessToken,
  refreshAccessToken,
  clearAllAuthData,
} from '@/services/auth/token.service';

// Instância principal do axios
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Controle de estado para evitar múltiplas renovações simultâneas
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Adiciona callback para ser executado quando o token for renovado
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notifica todos os callbacks aguardando pela renovação do token
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * REQUEST INTERCEPTOR
 * Adiciona token e renova automaticamente se expirado
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window === 'undefined') return config;

    const requestUrl = config.url || '';

    // Ignora rotas públicas (login, register, refresh)
    const isPublicRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (isPublicRoute) {
      return config;
    }

    // Obtém token atual
    let token = getAccessToken();

    if (!token) {
      // Não tem token, deixa a requisição prosseguir (vai dar 401)
      return config;
    }

    // Verifica se o token está expirado
    if (isTokenExpired(token)) {
      if (isRefreshing) {
        // Já está renovando, aguarda renovação
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(config);
          });
        });
      }

      // Inicia renovação
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Renovação bem-sucedida
          if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }

          // Notifica requisições pendentes
          onTokenRefreshed(newToken);
          isRefreshing = false;

          return config;
        } else {
          // Renovação falhou, limpa tudo e redireciona
          isRefreshing = false;
          clearAllAuthData();

          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/session-expired') {
            window.location.href = '/session-expired';
          }

          return Promise.reject(new Error('Token expirado e renovação falhou'));
        }
      } catch (error) {
        // Erro na renovação
        isRefreshing = false;
        clearAllAuthData();

        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/session-expired') {
          window.location.href = '/session-expired';
        }

        return Promise.reject(error);
      }
    }

    // Token válido, adiciona ao header
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * RESPONSE INTERCEPTOR
 * Trata erros 401 e tenta renovar token automaticamente
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = originalRequest?.url || '';

    // Ignora rotas públicas
    const isPublicRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (status === 401 && !isPublicRoute) {
      // Tenta renovar token uma vez
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAccessToken();

          if (newToken && originalRequest.headers) {
            // Atualiza header da requisição original
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry da requisição original
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Renovação falhou, limpa tudo
          clearAllAuthData();

          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/session-expired') {
              window.location.href = '/session-expired';
            }
          }

          return Promise.reject(refreshError);
        }
      }

      // Já tentou renovar e falhou, limpa tudo
      clearAllAuthData();

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
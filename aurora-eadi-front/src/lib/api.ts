import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { isTokenExpired } from './jwt-helper';
import {
  getAccessToken,
  refreshAccessToken,
  clearAllAuthData,
} from '@/services/auth/token.service';

// Função para obter a base URL dinamicamente
const getBaseURL = () => {
  // No servidor (SSR), usa variável de ambiente ou fallback
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api';
  }
  // No cliente, usa window.location.origin + /api
  return `${window.location.origin}/api`;
};

// Instância principal do axios
export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NEXT_PUBLIC_API_KEY ? { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY } : {}),
  },
});

// Controle de estado para evitar múltiplas renovações simultâneas
let isRefreshing = false;

// Fila de requisições aguardando renovação do token
// Armazena as funções resolve/reject das Promises pausadas
type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

let failedQueue: QueueItem[] = [];

/**
 * Adiciona requisição à fila de espera
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

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
      // Se já houver um refresh em andamento, enfileira esta requisição
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              if (config.headers) {
                config.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(config);
            },
            reject: (err) => {
              reject(err);
            },
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

          // Processa a fila com sucesso
          processQueue(null, newToken);
          isRefreshing = false;

          return config;
        } else {
          // Renovação falhou
          throw new Error('Falha ao renovar token');
        }
      } catch (error) {
        // Erro na renovação
        isRefreshing = false;

        // Rejeita todas as requisições na fila
        processQueue(error, null);

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

    if (status === 401 && !isPublicRoute && !originalRequest._retry) {
      // Marca como retry para não entrar em loop infinito
      originalRequest._retry = true;

      if (isRefreshing) {
        // Se já está renovando, adiciona à fila e aguarda
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              // Refaz a requisição original
              resolve(api(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Atualiza header da requisição original
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Processa fila de requisições pendentes
          processQueue(null, newToken);
          isRefreshing = false;

          // Retry da requisição original
          return api(originalRequest);
        } else {
          throw new Error('Refresh token falhou');
        }
      } catch (refreshError) {
        isRefreshing = false;

        // Rejeita fila
        processQueue(refreshError, null);

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

    return Promise.reject(error);
  },
);

export default api;
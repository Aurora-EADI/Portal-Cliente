import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  refreshAccessTokenWithRetry,
  clearAllAuthData,
} from '@/services/auth/token.service';

// Instância principal do axios — withCredentials envia cookies automaticamente
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  withCredentials: true, // browser envia cookies httpOnly em todas as requisições
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NEXT_PUBLIC_API_KEY ? { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY } : {}),
  },
});

// Controle de estado para evitar múltiplas renovações simultâneas
let isRefreshing = false;

// Fila de requisições aguardando renovação do token
type QueueItem = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let failedQueue: QueueItem[] = [];

/**
 * Processa a fila de requisições pausadas após tentativa de refresh
 */
const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

/**
 * RESPONSE INTERCEPTOR
 * Trata erros 401 — tenta renovar o token via cookie e faz retry
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const requestUrl = originalRequest?.url || '';

    // Ignora rotas públicas para evitar loop infinito
    const isPublicRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (status === 401 && !isPublicRoute && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('[INTERCEPTOR] 401 recebido para:', requestUrl);

      if (isRefreshing) {
        // Outro refresh já está em andamento — enfileira e aguarda
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        console.log('[INTERCEPTOR] tentando refresh com retry...');
        // Tenta até 2 vezes com back-off antes de deslogar (erros transitórios de rede)
        const success = await refreshAccessTokenWithRetry(2);

        console.log('[INTERCEPTOR] refresh resultado:', success ? 'sucesso' : 'falhou');

        if (success) {
          // Refresh bem-sucedido — libera a fila e retry da requisição original
          processQueue(null);
          isRefreshing = false;
          return api(originalRequest);
        } else {
          throw new Error('Refresh token falhou após todas as tentativas');
        }
      } catch (refreshError) {
        isRefreshing = false;

        // Rejeita todas as requisições na fila
        processQueue(refreshError);

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

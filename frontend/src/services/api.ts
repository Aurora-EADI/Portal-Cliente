import type { AxiosRequestConfig } from 'axios';
import { api } from '@/lib/api';
import type { User } from '@/types';

const EXPIRES_AT_KEY = 'session_expires_at';

export function getSessionExpiresAt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(EXPIRES_AT_KEY);
  } catch {
    return null;
  }
}

function rememberSessionExpiry(expiresAt: string | undefined) {
  if (typeof window === 'undefined' || !expiresAt) return;
  try {
    window.sessionStorage.setItem(EXPIRES_AT_KEY, expiresAt);
  } catch {
    // modo privado / storage bloqueado — o contador de sessao apenas nao aparece
  }
}

function forgetSessionExpiry() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(EXPIRES_AT_KEY);
  } catch {
    // idem
  }
}

function extractMessage(error: any, fallback: string): string {
  const backendMessage = error?.response?.data?.message;
  if (typeof backendMessage === 'string') return backendMessage;
  if (Array.isArray(backendMessage)) return backendMessage.join(', ');
  return fallback;
}

export const authService = {
  login: async (email: string, password: string) => {
    // O servidor grava o cookie httpOnly na resposta; nada de token no corpo.
    const response = await api
      .post('/auth/login', { email, password })
      .catch((error) => {
        throw new Error(extractMessage(error, 'Erro ao autenticar'));
      });

    const { user, expires_at } = response.data;
    rememberSessionExpiry(expires_at);

    return { user, expires_at };
  },

  logout: async () => {
    forgetSessionExpiry();
    try {
      await api.post('/auth/logout');
    } catch {
      // Sessao ja invalida no servidor: o logout local segue mesmo assim.
    }
  },

  /**
   * Sonda a mesma API usada no login, com renovacao por cookie quando disponivel.
   * Um visitante anonimo nao deve ser redirecionado durante essa sondagem.
   */
  restoreSession: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me', {
        _sessionProbe: true,
      } as AxiosRequestConfig & { _sessionProbe: boolean });
      return response.data.user as User;
    } catch (error: any) {
      if (error?.response?.status === 401) return null;
      throw error;
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error: any) {
      const rejected = new Error(extractMessage(error, 'Erro ao buscar perfil')) as Error & {
        status?: number;
      };
      rejected.status = error.response?.status;
      return Promise.reject(rejected);
    }
  },
};

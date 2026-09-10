import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import type { User } from '@/types';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password }).catch((error) => {
      const message = error.response?.data?.message || 'Erro ao autenticar';
      throw new Error(message);
    });

    const { user, token, refreshToken, expires_at } = response.data;
    Cookies.set('access_token', token, { sameSite: 'lax', expires: 1 });
    if (refreshToken) {
      Cookies.set('refresh_token', refreshToken, { sameSite: 'lax', expires: 7 });
    } else {
      Cookies.remove('refresh_token');
    }

    return { user, expires_at };
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar perfil';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      const rejected = new Error(message) as Error & { status?: number };
      rejected.status = error.response?.status;
      return Promise.reject(rejected);
    }
  },
};

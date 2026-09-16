import { apiNest } from '@/lib/apiNest';
import { authClient } from '@/lib/auth-client';
import type { User } from '@/types';
import { getErrorMessage, getErrorStatus, normalizeAuthError } from '@/lib/error-message';

export const authService = {
  login: async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      throw normalizeAuthError(result.error);
    }
    const user = await authService.getProfile();
    return { user };
  },

  logout: async () => {
    await authClient.signOut();
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await apiNest.get('/account/me');
      return response.data.user;
    } catch (error: unknown) {
      const rejected = new Error(getErrorMessage(error, 'Erro ao buscar perfil')) as Error & {
        status?: number;
      };
      rejected.status = getErrorStatus(error);
      return Promise.reject(rejected);
    }
  },
};

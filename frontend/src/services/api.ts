import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';
import type { User } from '@/types';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

const MOCK_USERS: Record<string, User> = {
  admin: {
    id: 'mock-admin-1', name: 'Admin Aurora', email: 'admin@aurora.com',
    role: UserRole.ADMIN, companyId: null, clienteId: null, position: 'Administrador',
    active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    cliente: null,
  },
  employee: {
    id: 'mock-emp-1', name: 'Funcionário Aurora', email: 'funcionario@aurora.com',
    role: UserRole.EMPLOYEE, companyId: null, clienteId: null, position: 'Analista',
    active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    cliente: null,
  },
  cliente: {
    id: 'mock-cli-1', name: 'Global Importações', email: 'cliente@aurora.com',
    role: UserRole.CLIENTE, companyId: null, clienteId: 'cli-1', position: null,
    active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    cliente: { id: 'cli-1', nome: 'Global Importações e Logística Ltda' },
  },
};

export const authService = {
  login: async (email: string, password: string, _role?: UserRole) => {
    if (MOCK_MODE) {
      const key = email.includes('admin') ? 'admin' : email.includes('func') || email.includes('employee') ? 'employee' : 'cliente';
      const user = { ...MOCK_USERS[key], email };
      const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return { user, expires_at };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const user = await authService.getProfile();
    const expires_at = data.session.expires_at
      ? new Date(data.session.expires_at * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();

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

      return Promise.reject(new Error(message));
    }
  },
};

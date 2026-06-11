import { api } from '@/lib/api';
import { UserRole } from '@/types';
import type { User } from '@/types';

const validRoles = Object.values(UserRole);
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
  login: async (email: string, password: string, role: UserRole) => {
    if (MOCK_MODE) {
      const key = email.includes('admin') ? 'admin' : email.includes('func') || email.includes('employee') ? 'employee' : 'cliente';
      const user = { ...MOCK_USERS[key], email };
      const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return { user, expires_at };
    }

    if (!validRoles.includes(role)) {
      return Promise.reject(new Error(`Tipo de acesso inválido. Valores válidos: ${validRoles.join(', ')}`));
    }

    try {
      const response = await api.post('/auth/login', { email, password, role });
      return {
        user: response.data.user,
        expires_at: response.data.expires_at,
      };
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao fazer login';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      } else if (backendMessage && typeof backendMessage === 'object') {
        message = JSON.stringify(backendMessage);
      }

      return Promise.reject(new Error(message));
    }
  },

  getProfile: async () => {
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

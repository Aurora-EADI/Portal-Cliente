import httpClient from './httpClient';
import { User, UserRole, CreateCompanyDTO, CreateUserDTO } from '@/types';

const validRoles = Object.values(UserRole);

/**
 * Serviço de autenticação
 */
export const authService = {
  /**
   * Faz login do usuário
   */
  login: async (email: string, password: string, role: UserRole) => {
    // Validação front-end da role antes de enviar
    if (!validRoles.includes(role)) {
      return Promise.reject(new Error(`Tipo de acesso inválido. Valores válidos: ${validRoles.join(', ')}`));
    }

    try {
      const response = await httpClient.post('/auth/login', { email, password, role });

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }

      return response.data.user;
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

      // ✅ IMPORTANTE: Use Promise.reject ao invés de throw
      return Promise.reject(new Error(message));
    }
  },

  /**
   * Registra um novo usuário e empresa
   */
  register: async (payload: { company: CreateCompanyDTO; user: CreateUserDTO }) => {
    try {
      const response = await httpClient.post('/auth/register', payload);
      return response.data.user;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao registrar';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      } else if (backendMessage && typeof backendMessage === 'object') {
        message = JSON.stringify(backendMessage);
      }

      // ✅ Use Promise.reject ao invés de throw
      return Promise.reject(new Error(message));
    }
  },

  /**
   * Busca dados do perfil do usuário logado
   */
  getProfile: async () => {
    try {
      const response = await httpClient.get('/auth/me');
      return response.data.user;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar perfil';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      } else if (backendMessage && typeof backendMessage === 'object') {
        message = JSON.stringify(backendMessage);
      }

      // ✅ Use Promise.reject ao invés de throw
      return Promise.reject(new Error(message));
    }
  },
};
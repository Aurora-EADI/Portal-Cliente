import httpClient from './httpClient';
import { User, UserRole, CreateCompanyDTO, CreateUserDTO, Document, DocumentStatus, Company, CompanyStatus } from '@/types';

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

/**
 * Serviço de documentos
 */
export const documentService = {
  /**
   * Busca todos os documentos (admin)
   */
  getAll: async (): Promise<Document[]> => {
    try {
      const response = await httpClient.get('/documents');
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar documentos';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Busca documentos por empresa
   */
  getByCompany: async (companyId: string): Promise<Document[]> => {
    try {
      const response = await httpClient.get(`/documents/company/${companyId}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar documentos da empresa';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Faz upload de documento
   */
  upload: async (file: File, name: string, user: User): Promise<Document> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (user.companyId) {
        formData.append('companyId', user.companyId);
      }

      const response = await httpClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao fazer upload do documento';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Atualiza status do documento
   */
  updateStatus: async (id: string, status: DocumentStatus, reason?: string): Promise<Document> => {
    try {
      const response = await httpClient.patch(`/documents/${id}/status`, { status, rejectionReason: reason });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao atualizar status do documento';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },
};

/**
 * Interface para resposta de empresa com responsável
 */
export interface CompanyWithResponsible {
  company: Company;
  responsible: User;
}

/**
 * Serviço de empresas
 */
export const companyService = {
  /**
   * Busca todas as empresas com seus responsáveis
   */
  getAllWithResponsible: async (): Promise<CompanyWithResponsible[]> => {
    try {
      const response = await httpClient.get('/companies/with-responsible');
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar empresas';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Atualiza status da empresa
   */
  updateStatus: async (id: string, status: CompanyStatus): Promise<Company> => {
    try {
      const response = await httpClient.patch(`/companies/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao atualizar status da empresa';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },
};
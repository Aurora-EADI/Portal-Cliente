import { api } from '@/lib/api';
import { User, UserRole, CreateCompanyDTO, CreateUserDTO, Document, DocumentStatus, Company, CompanyStatus, DocumentType } from '@/types';

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
      const response = await api.post('/auth/login', { email, password, role });

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
  register: async (payload: { companyId?: string; company: CreateCompanyDTO; user: CreateUserDTO }) => {
    try {
      const response = await api.post('/auth/register', payload);
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
      const response = await api.get('/auth/me');
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
   * Por padrão, retorna TODOS os documentos (incluindo histórico de versões)
   */
  getAll: async (): Promise<Document[]> => {
    try {
      const response = await api.get('/documents', {
        params: { latestOnly: 'false' } // ← Busca TODO o histórico
      });
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
      const response = await api.get(`/documents/company/${companyId}`);
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
  upload: async (file: File, name: string, user: User, dateIssue?: string, dateExpiration?: string, documentTypeId?: string): Promise<Document> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      if (user.companyId) {
        formData.append('companyId', String(user.companyId));
      }
      if (dateIssue) {
        formData.append('dateIssue', dateIssue);
      }
      if (dateExpiration) {
        formData.append('dateExpiration', dateExpiration);
      }
      if (documentTypeId) {
        formData.append('documentTypeId', documentTypeId);
      }

      const response = await api.post('/documents/upload', formData, {
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
      const response = await api.patch(`/documents/${id}/status`, { status, rejectionReason: reason });
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

  /**
   * Busca URL de download do documento
   */
  getDownloadUrl: async (id: string): Promise<string> => {
    try {
      const response = await api.get(`/documents/${id}/download`);
      return response.data.url;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar URL de download';

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
 * Interface para parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statusCounts?: Record<string, number>;
}


export const companyService = {

  getAllWithResponsible: async (params?: PaginationParams): Promise<PaginatedResponse<CompanyWithResponsible>> => {
    try {
      const response = await api.get('/companies/with-responsible', { params });
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

  getActiveCompanies: async (params?: PaginationParams): Promise<PaginatedResponse<Company>> => {
    try {
      const response = await api.get('/companies/active', { params });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar empresas ativas';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },


  updateStatus: async (id: string, status: CompanyStatus): Promise<Company> => {
    try {
      const response = await api.patch(`/companies/${id}/status`, { status });
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

/**
 * Serviço de tipos de documentos
 */
export const documentTypeService = {
  getAll: async (): Promise<DocumentType[]> => {
    try {
      const response = await api.get('/document-types');
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar tipos de documentos'));
    }
  },

  create: async (data: { name: string; description?: string }): Promise<DocumentType> => {
    try {
      const response = await api.post('/document-types', data);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao criar tipo de documento'));
    }
  },

  update: async (id: number, data: { name?: string; description?: string; active?: boolean }): Promise<DocumentType> => {
    try {
      const response = await api.patch(`/document-types/${id}`, data);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao atualizar tipo de documento'));
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/document-types/${id}`);
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao excluir tipo de documento'));
    }
  },
};

export const companyRequirementService = {
  getRequirements: async (companyId: string): Promise<{ documentTypeId: number; isRequired: boolean }[]> => {
    try {
      const response = await api.get(`/companies/${companyId}/requirements`);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar requisitos'));
    }
  },

  updateRequirements: async (companyId: string, requirements: { documentTypeId: number; isRequired: boolean }[]): Promise<void> => {
    try {
      await api.patch(`/companies/${companyId}/requirements`, { requirements });
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao atualizar requisitos'));
    }
  },
};

export const supplierRequirementsService = {
  getMyRequirements: async (): Promise<{ documentTypeId: number; isRequired: boolean; documentType: DocumentType }[]> => {
    try {
      const response = await api.get('/suppliers/me/requirements');
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar requisitos'));
    }
  },
};
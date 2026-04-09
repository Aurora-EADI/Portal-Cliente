import { api } from '@/lib/api';
import { User, UserRole, CreateCompanyDTO, CreateUserDTO, Document, DocumentStatus, Company, CompanyStatus, DocumentType, Customer, CustomerStatus, CreateCustomerDTO, UpdateCustomerDTO, Service, CreateServiceDto, UpdateServiceDto, EmployeeStatus } from '@/types';

const validRoles = Object.values(UserRole);

/**
 * Serviço de autenticação
 */
export const authService = {
  /**
   * Faz login do usuário
   * Retorna o usuário e expires_at — tokens ficam em cookies httpOnly gerenciados pelo backend
   */
  login: async (email: string, password: string, role: UserRole) => {
    // Validação front-end da role antes de enviar
    if (!validRoles.includes(role)) {
      return Promise.reject(new Error(`Tipo de acesso inválido. Valores válidos: ${validRoles.join(', ')}`));
    }

    try {
      const response = await api.post('/auth/login', { email, password, role });

      // Retorna user e expires_at — tokens ficam em cookies httpOnly
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
   * Faz download do documento via streaming do backend
   */
  download: async (id: string): Promise<void> => {
    console.log('[DOWNLOAD] Iniciando download do documento:', id);

    try {
      console.log('[DOWNLOAD] Fazendo requisição para:', `/documents/${id}/download`);
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });

      console.log('[DOWNLOAD] Resposta recebida:', {
        status: response.status,
        headers: response.headers,
        dataType: typeof response.data,
        dataSize: response.data?.size || 'unknown'
      });

      // Extrai o nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'documento.pdf';

      if (contentDisposition) {
        console.log('[DOWNLOAD] Content-Disposition:', contentDisposition);
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          console.log('[DOWNLOAD] Nome do arquivo extraído:', filename);
        }
      } else {
        console.warn('[DOWNLOAD] Header Content-Disposition não encontrado');
      }

      // Cria um blob com o tipo correto
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      console.log('[DOWNLOAD] Content-Type:', contentType);

      const blob = new Blob([response.data], { type: contentType });
      console.log('[DOWNLOAD] Blob criado:', {
        size: blob.size,
        type: blob.type
      });

      const url = window.URL.createObjectURL(blob);
      console.log('[DOWNLOAD] URL do blob criada:', url);

      // Cria um link temporário e faz o download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      console.log('[DOWNLOAD] Link criado e adicionado ao DOM');

      link.click();
      console.log('[DOWNLOAD] Link clicado, download deve iniciar');

      // Aguarda um pouco antes de limpar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('[DOWNLOAD] Recursos limpos');
      }, 100);
    } catch (error: any) {
      console.error('[DOWNLOAD] Erro ao fazer download:', error);
      console.error('[DOWNLOAD] Erro detalhado:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });

      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao fazer download do documento';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * @deprecated Use o método download() para fazer download via streaming
   * Busca URL de download do documento (mantido para compatibilidade)
   */
  getDownloadUrl: async (id: string): Promise<string> => {
    // Agora retorna a URL do endpoint de download
    return `/api/documents/${id}/download`;
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
  onlyPending?: boolean;
  supplierTypeName?: string;
  supplierTypeId?: string;
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
  /**
   * Solicitar acesso: Atualiza empresa e usuário SUPPLIER
   */
  requestAccess: async (companyId: string, payload: { company: CreateCompanyDTO; user: CreateUserDTO }) => {
    try {
      const response = await api.patch(`/companies/${companyId}/request-access`, payload);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao solicitar acesso';

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

export interface SupplierTypeDto {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface RequirementRuleItemDto {
  documentTypeId: number;
  isRequired: boolean;
}

export interface RequirementRuleDto {
  companyClassification: 'MEI' | 'ME' | 'EPP' | 'EIRELI';
  allocationRegime: 'NO_WORKFORCE_AT_EADI' | 'FULL_WORKFORCE_AT_EADI';
  supplierTypeId: string;
  items: RequirementRuleItemDto[];
  active: boolean;
}

export interface CompanyWorkforceEmployeeDto {
  id?: string;
  fullName: string;
  cpf: string;
  position: string;
  hiredAt: string;
  status?: EmployeeStatus;
}

export interface WorkforceListItemDto {
  id: string;
  fullName: string;
  cpf: string;
  position: string;
  hiredAt: string;
  status: EmployeeStatus;
  company: {
    id: string;
    fantasyName: string;
    socialReason?: string;
  };
  hasPendingDocuments?: boolean;
}

export interface WorkforceDetailsDto {
  id: string;
  fullName: string;
  cpf: string;
  position: string;
  hiredAt: string;
  status: EmployeeStatus;
  company: {
    id: string;
    fantasyName: string;
    socialReason?: string;
    cnpj?: string;
    phone?: string;
  };
}

export interface WorkforceDocumentRequirementDto {
  id: string;
  companyId: string;
  documentTypeId: number;
  isRequired: boolean;
  active: boolean;
  documentType: DocumentType;
}

export interface WorkforceDocumentDto {
  id: string;
  companyEmployeeId: string;
  companyId: string;
  uploadedByUserId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  status: DocumentStatus;
  rejectionReason?: string;
  dateIssue?: string;
  dateExpiration?: string;
  uploadedAt: string;
  updatedAt: string;
  documentTypeId?: number;
  isLatest: boolean;
  documentType?: DocumentType;
}

export const requirementRulesService = {
  getSupplierTypes: async (): Promise<SupplierTypeDto[]> => {
    const response = await api.get('/requirement-rules/supplier-types');
    return response.data;
  },

  createSupplierType: async (payload: { name: string; description?: string; active?: boolean }): Promise<SupplierTypeDto> => {
    const response = await api.post('/requirement-rules/supplier-types', payload);
    return response.data;
  },

  updateSupplierType: async (id: string, payload: { name?: string; description?: string; active?: boolean }): Promise<SupplierTypeDto> => {
    const response = await api.patch(`/requirement-rules/supplier-types/${id}`, payload);
    return response.data;
  },

  getRules: async () => {
    const response = await api.get('/requirement-rules');
    return response.data;
  },

  upsertRule: async (payload: RequirementRuleDto) => {
    const response = await api.post('/requirement-rules', payload);
    return response.data;
  },

  updateCompanyProfile: async (
    companyId: string,
    payload: {
      classification: 'MEI' | 'ME' | 'EPP' | 'EIRELI';
      allocationRegime: 'NO_WORKFORCE_AT_EADI' | 'FULL_WORKFORCE_AT_EADI';
      supplierTypeIds: string[];
    },
  ) => {
    const response = await api.put(`/requirement-rules/companies/${companyId}/profile`, payload);
    return response.data;
  },

  getCompanyWorkforce: async (companyId: string): Promise<CompanyWorkforceEmployeeDto[]> => {
    const response = await api.get(`/requirement-rules/companies/${companyId}/workforce`);
    return response.data;
  },

  updateCompanyWorkforce: async (
    companyId: string,
    employees: CompanyWorkforceEmployeeDto[],
  ): Promise<CompanyWorkforceEmployeeDto[]> => {
    const response = await api.put(`/requirement-rules/companies/${companyId}/workforce`, { employees });
    return response.data;
  },

  listWorkforce: async (params?: PaginationParams & { companyId?: string }): Promise<PaginatedResponse<WorkforceListItemDto>> => {
    const response = await api.get('/requirement-rules/workforce', { params });
    return response.data;
  },

  getWorkforceById: async (id: string): Promise<WorkforceDetailsDto> => {
    const response = await api.get(`/requirement-rules/workforce/${id}`);
    return response.data;
  },

  updateWorkforceStatus: async (id: string, status: EmployeeStatus): Promise<WorkforceDetailsDto> => {
    const response = await api.patch(`/requirement-rules/workforce/${id}/status`, { status });
    return response.data;
  },

  getWorkforceRequirements: async (companyId: string): Promise<WorkforceDocumentRequirementDto[]> => {
    const response = await api.get(`/requirement-rules/companies/${companyId}/workforce-requirements`);
    return response.data;
  },

  updateWorkforceRequirements: async (
    companyId: string,
    requirements: { documentTypeId: number; isRequired: boolean }[],
  ): Promise<WorkforceDocumentRequirementDto[]> => {
    const response = await api.put(`/requirement-rules/companies/${companyId}/workforce-requirements`, {
      requirements,
    });
    return response.data;
  },

  getGlobalWorkforceRequirements: async (): Promise<WorkforceDocumentRequirementDto[]> => {
    const response = await api.get('/requirement-rules/workforce-requirements/global');
    return response.data;
  },

  updateGlobalWorkforceRequirements: async (
    requirements: { documentTypeId: number; isRequired: boolean }[],
  ): Promise<WorkforceDocumentRequirementDto[]> => {
    const response = await api.put('/requirement-rules/workforce-requirements/global', {
      requirements,
    });
    return response.data;
  },
};

export const workforceDocumentService = {
  upload: async (payload: {
    file: File;
    companyEmployeeId: string;
    name: string;
    dateIssue?: string;
    dateExpiration?: string;
    documentTypeId?: string;
  }): Promise<WorkforceDocumentDto> => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('companyEmployeeId', payload.companyEmployeeId);
    formData.append('name', payload.name);
    if (payload.dateIssue) formData.append('dateIssue', payload.dateIssue);
    if (payload.dateExpiration) formData.append('dateExpiration', payload.dateExpiration);
    if (payload.documentTypeId) formData.append('documentTypeId', payload.documentTypeId);

    const response = await api.post('/workforce-documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listByEmployee: async (employeeId: string, latestOnly = false): Promise<WorkforceDocumentDto[]> => {
    const response = await api.get(`/workforce-documents/employee/${employeeId}`, {
      params: { latestOnly: latestOnly ? 'true' : 'false' },
    });
    return response.data;
  },

  listMissingByEmployee: async (employeeId: string): Promise<WorkforceDocumentRequirementDto[]> => {
    const response = await api.get(`/workforce-documents/employee/${employeeId}/missing`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: DocumentStatus,
    rejectionReason?: string,
  ): Promise<WorkforceDocumentDto> => {
    const response = await api.patch(`/workforce-documents/${id}/status`, {
      status,
      rejectionReason,
    });
    return response.data;
  },

  getDownloadUrl: async (id: string): Promise<string> => {
    const response = await api.get(`/workforce-documents/${id}/download`);
    return response.data.url;
  },
};

/**
 * Serviço de clientes
 */
export const customerService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Customer>> => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar clientes';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  getById: async (id: string): Promise<Customer> => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar cliente';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  create: async (data: CreateCustomerDTO): Promise<Customer> => {
    try {
      const response = await api.post('/customers', data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao criar cliente';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  update: async (id: string, data: UpdateCustomerDTO): Promise<Customer> => {
    try {
      const response = await api.patch(`/customers/${id}`, data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao atualizar cliente';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  updateStatus: async (id: string, status: CustomerStatus): Promise<Customer> => {
    try {
      const response = await api.patch(`/customers/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao atualizar status do cliente';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/customers/${id}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao excluir cliente';

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
 * Serviço de serviços (catálogo de serviços)
 */
export const serviceService = {
  getAll: async (includeInactive = false): Promise<Service[]> => {
    try {
      const response = await api.get('/services', {
        params: { includeInactive: includeInactive.toString() }
      });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar serviços';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  getById: async (id: string): Promise<Service> => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar serviço';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  create: async (data: CreateServiceDto): Promise<Service> => {
    try {
      const response = await api.post('/services', data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao criar serviço';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  update: async (id: string, data: UpdateServiceDto): Promise<Service> => {
    try {
      const response = await api.patch(`/services/${id}`, data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao atualizar serviço';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  toggleStatus: async (id: string): Promise<Service> => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao alterar status do serviço';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/services/${id}/hard`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao excluir serviço';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },
};

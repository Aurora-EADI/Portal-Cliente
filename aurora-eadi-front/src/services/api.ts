import httpClient from './httpClient';
import { User, Company, Document, UserRole, DocumentStatus, CompanyStatus, CreateCompanyDTO, CreateUserDTO } from '@/types';

const DELAY_MS = 0; // Remove delay artificial em produção

// --- AUTH SERVICE ---
export const authService = {
  login: async (email: string, password: string, role: UserRole) => {
    try {
      const response = await httpClient.post('/auth/login', { 
        email, 
        password, 
        role 
      });
      
      // Salva o token JWT
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      
      return response.data.user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      throw new Error(message);
    }
  },

  register: async (payload: { company: CreateCompanyDTO, user: CreateUserDTO }) => {
    try {
      const response = await httpClient.post('/auth/register', payload);
      return response.data.user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao registrar';
      throw new Error(message);
    }
  },

  getProfile: async () => {
    try {
      const response = await httpClient.get('/auth/me');
      return response.data.user;
    } catch (error: any) {
      throw new Error('Erro ao buscar perfil');
    }
  }
};

// --- DOCUMENT SERVICE ---
export const documentService = {
  getAll: async () => {
    try {
      const response = await httpClient.get('/documents');
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao buscar documentos');
    }
  },

  getByCompany: async (companyId: string) => {
    try {
      const response = await httpClient.get(`/documents/company/${companyId}`);
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao buscar documentos da empresa');
    }
  },

  upload: async (file: File, name: string, user: User) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      
      const response = await httpClient.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao fazer upload do documento');
    }
  },

  updateStatus: async (id: string, status: DocumentStatus, reason?: string) => {
    try {
      const response = await httpClient.patch(`/documents/${id}/status`, { 
        status, 
        rejectionReason: reason 
      });
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao atualizar status do documento');
    }
  }
};

// --- COMPANY SERVICE ---
export const companyService = {
  getAllWithResponsible: async () => {
    try {
      const response = await httpClient.get('/companies/with-responsible');
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao buscar empresas');
    }
  },

  updateStatus: async (id: string, status: CompanyStatus) => {
    try {
      const response = await httpClient.patch(`/companies/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error('Erro ao atualizar status da empresa');
    }
  }
};
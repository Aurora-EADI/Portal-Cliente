import { api } from '@/lib/api';
import {
  Service,
  ServiceCost,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceCostDto,
} from '@/types';

/**
 * Serviço de API para gerenciar Serviços do Simulador Marítimo
 */
export const serviceService = {
  /**
   * Lista todos os serviços ativos
   */
  getAll: async (includeInactive = false): Promise<Service[]> => {
    try {
      const params = includeInactive ? { includeInactive: 'true' } : {};
      const response = await api.get('/services', { params });
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

  /**
   * Busca um serviço por ID
   */
  getById: async (id: string): Promise<Service> => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar serviço'));
    }
  },

  /**
   * Busca o custo vigente de um serviço
   */
  getCurrentCost: async (id: string): Promise<{ service: any; currentCost: ServiceCost | null }> => {
    try {
      const response = await api.get(`/services/${id}/current-cost`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar custo vigente'));
    }
  },

  /**
   * Cria um novo serviço
   */
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

  /**
   * Atualiza um serviço
   */
  update: async (id: string, data: UpdateServiceDto): Promise<Service> => {
    try {
      const response = await api.patch(`/services/${id}`, data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao atualizar serviço'));
    }
  },

  /**
   * Desativa um serviço (soft delete)
   */
  remove: async (id: string): Promise<Service> => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao desativar serviço'));
    }
  },
};

/**
 * Serviço de API para gerenciar Custos de Serviços
 */
export const serviceCostService = {
  /**
   * Cria um novo custo (marca o anterior como expirado automaticamente)
   */
  create: async (data: CreateServiceCostDto): Promise<ServiceCost> => {
    try {
      const response = await api.post('/service-costs', data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao criar custo';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Busca histórico de custos de um serviço
   */
  getByService: async (serviceId: string): Promise<ServiceCost[]> => {
    try {
      const response = await api.get(`/service-costs/by-service/${serviceId}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar histórico de custos'));
    }
  },

  /**
   * Busca custo vigente de um serviço
   */
  getCurrent: async (serviceId: string): Promise<ServiceCost> => {
    try {
      const response = await api.get(`/service-costs/current/${serviceId}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar custo vigente'));
    }
  },
};

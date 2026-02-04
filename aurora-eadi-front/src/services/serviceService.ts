import { api } from '@/lib/api';
import {
  Service,
  ServiceCost,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceCostDto,
} from '@/types';

export const serviceService = {
  /**
   * Mantém o endpoint /services, mas adiciona o filtro 'modal' como opcional
   */
  getAll: async (includeInactive = false, modal?: 'AIR' | 'MARITIME' | 'BOTH'): Promise<Service[]> => {
    try {
      const params: any = {};
      if (includeInactive) params.includeInactive = 'true';
      if (modal) params.modal = modal; // Passa o filtro via query string: /services?modal=AIR

      const response = await api.get('/services', { params });
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar serviços'));
    }
  },

  // Funções de conveniência que usam o getAll acima (Mais seguro que criar novas URLs)
  getAirServices: (includeInactive = false) => serviceService.getAll(includeInactive, 'AIR'),
  getMaritimeServices: (includeInactive = false) => serviceService.getAll(includeInactive, 'MARITIME'),

  getById: async (id: string): Promise<Service> => {
    try {
      const response = await api.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar serviço'));
    }
  },

  getCurrentCost: async (id: string): Promise<{ service: any; currentCost: ServiceCost | null }> => {
    try {
      const response = await api.get(`/services/${id}/current-cost`);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar custo vigente'));
    }
  },

  create: async (data: CreateServiceDto): Promise<Service> => {
    try {
      const response = await api.post('/services', data);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao criar serviço'));
    }
  },

  update: async (id: string, data: UpdateServiceDto): Promise<Service> => {
    try {
      const response = await api.patch(`/services/${id}`, data);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao atualizar serviço'));
    }
  },

  activate: async (id: string): Promise<Service> => {
    // Tenta ativar via update para ser compatível com qualquer backend
    return serviceService.update(id, { isActive: true } as any);
  },

  remove: async (id: string): Promise<Service> => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao desativar serviço'));
    }
  },
};

// Mantendo o serviceCostService intacto (Vital para o seu histórico)
export const serviceCostService = {
  create: async (data: CreateServiceCostDto): Promise<ServiceCost> => {
    const response = await api.post('/service-costs', data);
    return response.data;
  },
  getByService: async (serviceId: string): Promise<ServiceCost[]> => {
    const response = await api.get(`/service-costs/by-service/${serviceId}`);
    return response.data;
  },
  getCurrent: async (serviceId: string): Promise<ServiceCost> => {
    const response = await api.get(`/service-costs/current/${serviceId}`);
    return response.data;
  }
};
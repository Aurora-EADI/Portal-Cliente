import { api } from '@/lib/api';
import {
  Simulation,
  SimulationService,
  CreateSimulationDto,
  UpdateSimulationDto,
  CreateNewVersionDto,
  AddSimulationServiceDto,
} from '@/types';

/**
 * Serviço de API para gerenciar Simulações Marítimas
 */
export const simulationService = {
  /**
   * Lista todas as simulações (apenas versões correntes)
   */
  getAll: async (supplierId?: string): Promise<Simulation[]> => {
    try {
      const params = supplierId ? { supplierId } : {};
      const response = await api.get('/simulations', { params });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar simulações';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Busca uma simulação por ID (com serviços)
   */
  getById: async (id: string): Promise<Simulation> => {
    try {
      const response = await api.get(`/simulations/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar simulação'));
    }
  },

  /**
   * Busca histórico de versões de uma simulação
   */
  getVersionHistory: async (simulationNumber: string): Promise<Simulation[]> => {
    try {
      const response = await api.get(`/simulations/version-history/${simulationNumber}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar histórico de versões'));
    }
  },

  /**
   * Cria uma nova simulação (V1)
   */
  create: async (data: CreateSimulationDto): Promise<Simulation> => {
    try {
      const response = await api.post('/simulations', data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao criar simulação';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Cria uma nova versão de uma simulação existente
   */
  createNewVersion: async (data: CreateNewVersionDto): Promise<Simulation> => {
    try {
      const response = await api.post('/simulations/new-version', data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao criar nova versão';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Atualiza uma simulação
   */
  update: async (id: string, data: UpdateSimulationDto): Promise<Simulation> => {
    try {
      const response = await api.patch(`/simulations/${id}`, data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao atualizar simulação'));
    }
  },

  /**
   * Deleta uma simulação
   */
  remove: async (id: string): Promise<void> => {
    try {
      await api.delete(`/simulations/${id}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao deletar simulação'));
    }
  },

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  /**
   * Adiciona ou atualiza um serviço na simulação
   */
  addService: async (simulationId: string, data: AddSimulationServiceDto): Promise<SimulationService> => {
    try {
      const response = await api.post(`/simulations/${simulationId}/services`, data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao adicionar serviço';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Lista todos os serviços de uma simulação
   */
  getServices: async (simulationId: string): Promise<SimulationService[]> => {
    try {
      const response = await api.get(`/simulations/${simulationId}/services`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar serviços da simulação'));
    }
  },

  /**
   * Remove um serviço da simulação
   */
  removeService: async (simulationId: string, serviceId: string): Promise<void> => {
    try {
      await api.delete(`/simulations/${simulationId}/services/${serviceId}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao remover serviço'));
    }
  },
};

import { api } from '@/lib/api';
import {
  AirSimulation,
  CreateAirSimulationDto,
  UpdateAirSimulationDto,
  CreateAirNewVersionDto,
  AddAirSimulationServiceDto,
} from '@/types/air-simulation';
import { SimulationService } from '@/types';

/**
 * Serviço de API para gerenciar Simulações Aéreas
 */
export const airSimulationService = {
  /**
   * Lista todas as simulações aéreas (apenas versões correntes)
   */
  getAll: async (customerId?: string): Promise<AirSimulation[]> => {
    try {
      const params = customerId ? { customerId } : {};
      const response = await api.get('/air-simulations', { params });
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao buscar simulações aéreas';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Busca uma simulação aérea por ID (com serviços)
   */
  getById: async (id: string): Promise<AirSimulation> => {
    try {
      const response = await api.get(`/air-simulations/${id}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar simulação aérea'));
    }
  },

  /**
   * Busca histórico de versões de uma simulação aérea
   */
  getVersionHistory: async (simulationNumber: string): Promise<AirSimulation[]> => {
    try {
      const response = await api.get(`/air-simulations/version-history/${simulationNumber}`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar histórico de versões'));
    }
  },

  /**
   * Cria uma nova simulação aérea (V1)
   */
  create: async (data: CreateAirSimulationDto): Promise<AirSimulation> => {
    try {
      const response = await api.post('/air-simulations', data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let message = 'Erro ao criar simulação aérea';

      if (typeof backendMessage === 'string') {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage.join(', ');
      }

      return Promise.reject(new Error(message));
    }
  },

  /**
   * Cria uma nova versão de uma simulação aérea existente
   */
  createNewVersion: async (data: CreateAirNewVersionDto): Promise<AirSimulation> => {
    try {
      const response = await api.post('/air-simulations/new-version', data);
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
   * Atualiza uma simulação aérea
   */
  update: async (id: string, data: UpdateAirSimulationDto): Promise<AirSimulation> => {
    try {
      const response = await api.patch(`/air-simulations/${id}`, data);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao atualizar simulação aérea'));
    }
  },

  /**
   * Deleta uma simulação aérea
   */
  remove: async (id: string): Promise<void> => {
    try {
      await api.delete(`/air-simulations/${id}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao deletar simulação aérea'));
    }
  },

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  /**
   * Adiciona ou atualiza um serviço na simulação aérea
   */
  addService: async (simulationId: string, data: AddAirSimulationServiceDto): Promise<SimulationService> => {
    try {
      const response = await api.post(`/air-simulations/${simulationId}/services`, data);
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
   * Lista todos os serviços de uma simulação aérea
   */
  getServices: async (simulationId: string): Promise<SimulationService[]> => {
    try {
      const response = await api.get(`/air-simulations/${simulationId}/services`);
      return response.data;
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao buscar serviços da simulação aérea'));
    }
  },

  /**
   * Remove um serviço da simulação aérea
   */
  removeService: async (simulationId: string, serviceId: string): Promise<void> => {
    try {
      await api.delete(`/air-simulations/${simulationId}/services/${serviceId}`);
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      return Promise.reject(new Error(backendMessage || 'Erro ao remover serviço'));
    }
  },
};

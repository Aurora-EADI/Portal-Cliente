import { api } from '@/lib/api';
import {
  Flight,
  CargoItem,
  FlightHistoryRecord,
  CreateFlightDto,
  UpdateFlightDto,
  CreateCargoItemsDto,
  UpdateCargoItemDto,
  RevertFlightDto,
} from '@/types/ccte';

export const ccteService = {
  // ========== FLIGHTS ==========

  getAll: async (search?: string, status?: string): Promise<Flight[]> => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/ccte/flights', { params });
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao buscar voos'),
      );
    }
  },

  getById: async (id: string): Promise<Flight> => {
    try {
      const response = await api.get(`/ccte/flights/${id}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao buscar voo'),
      );
    }
  },

  create: async (data: CreateFlightDto): Promise<Flight> => {
    try {
      const response = await api.post('/ccte/flights', data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao criar voo'),
      );
    }
  },

  update: async (id: string, data: UpdateFlightDto): Promise<Flight> => {
    try {
      const response = await api.patch(`/ccte/flights/${id}`, data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao atualizar voo'),
      );
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/ccte/flights/${id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao excluir voo'),
      );
    }
  },

  markSent: async (id: string): Promise<Flight> => {
    try {
      const response = await api.patch(`/ccte/flights/${id}/send`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(
          typeof msg === 'string' ? msg : 'Erro ao marcar voo como enviado',
        ),
      );
    }
  },

  revert: async (id: string, data: RevertFlightDto): Promise<Flight> => {
    try {
      const response = await api.patch(`/ccte/flights/${id}/revert`, data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao reverter voo'),
      );
    }
  },

  getHistory: async (id: string): Promise<FlightHistoryRecord[]> => {
    try {
      const response = await api.get(`/ccte/flights/${id}/history`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao buscar historico'),
      );
    }
  },

  // ========== CARGO ITEMS ==========

  createCargoItems: async (
    flightId: string,
    data: CreateCargoItemsDto,
  ): Promise<CargoItem[]> => {
    try {
      const response = await api.post(
        `/ccte/flights/${flightId}/items`,
        data,
      );
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao adicionar cargas'),
      );
    }
  },

  updateCargoItem: async (
    id: string,
    data: UpdateCargoItemDto,
  ): Promise<CargoItem> => {
    try {
      const response = await api.patch(`/ccte/items/${id}`, data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao atualizar carga'),
      );
    }
  },

  deleteCargoItem: async (id: string): Promise<void> => {
    try {
      await api.delete(`/ccte/items/${id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao excluir carga'),
      );
    }
  },

  sendCargoItem: async (id: string): Promise<CargoItem> => {
    try {
      const response = await api.patch(`/ccte/items/${id}/send`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      return Promise.reject(
        new Error(typeof msg === 'string' ? msg : 'Erro ao enviar carga'),
      );
    }
  },
};

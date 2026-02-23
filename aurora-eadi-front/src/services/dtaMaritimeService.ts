import { api } from '@/lib/api';
import {
  BillOfLading,
  ContainerDta,
  CreateContainerDtaDto,
  CreateProcessoDto,
  ProcessoImportacao,
  UpdateContainerDtaDto,
  UpdateProcessoDto,
} from '@/types/dtaMaritime';

export const dtaMaritimeService = {
  // ========== PROCESSOS ==========

  getAll: async (search?: string): Promise<ProcessoImportacao[]> => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await api.get('/dta-maritime/processos', { params });
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao buscar processos');
    }
  },

  getById: async (id: string): Promise<ProcessoImportacao> => {
    try {
      const response = await api.get(`/dta-maritime/processos/${id}`);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao buscar processo');
    }
  },

  create: async (data: CreateProcessoDto): Promise<ProcessoImportacao> => {
    try {
      const response = await api.post('/dta-maritime/processos', data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao criar processo');
    }
  },

  update: async (id: string, data: UpdateProcessoDto): Promise<ProcessoImportacao> => {
    try {
      const response = await api.patch(`/dta-maritime/processos/${id}`, data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao atualizar processo');
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/dta-maritime/processos/${id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao excluir processo');
    }
  },

  // ========== CONTAINERS ==========

  addContainer: async (processoId: string, data: CreateContainerDtaDto): Promise<ContainerDta> => {
    try {
      const response = await api.post(`/dta-maritime/processos/${processoId}/containers`, data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao adicionar container');
    }
  },

  updateContainer: async (id: string, data: UpdateContainerDtaDto): Promise<ContainerDta> => {
    try {
      const response = await api.patch(`/dta-maritime/containers/${id}`, data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao atualizar container');
    }
  },

  deleteContainer: async (id: string): Promise<void> => {
    try {
      await api.delete(`/dta-maritime/containers/${id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao remover container');
    }
  },

  // ========== BILL OF LADINGS ==========

  addBl: async (containerId: string, numero: string): Promise<BillOfLading> => {
    try {
      const response = await api.post(`/dta-maritime/containers/${containerId}/bls`, { numero });
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao adicionar BL');
    }
  },

  deleteBl: async (id: string): Promise<void> => {
    try {
      await api.delete(`/dta-maritime/bls/${id}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      throw new Error(typeof msg === 'string' ? msg : 'Erro ao remover BL');
    }
  },
};

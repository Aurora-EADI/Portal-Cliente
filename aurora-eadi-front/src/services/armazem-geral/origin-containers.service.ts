import { api } from '@/lib/api';
import type {
  OriginContainerEntryDto,
  OriginContainerExitDto,
  OriginContainerListResponse,
  OriginContainerQueryParams,
  OriginContainerUpdateLocationDto,
  OperationalContainer,
  OperationalContainerDetails,
  OperationalContainerMovement,
} from '@/types/armazem-geral';

function toErrorMessage(error: any, fallback: string) {
  const backendMessage = error?.response?.data?.message;

  if (typeof backendMessage === 'string') return backendMessage;
  if (Array.isArray(backendMessage)) return backendMessage.join(', ');
  if (backendMessage && typeof backendMessage === 'object') return JSON.stringify(backendMessage);
  if (typeof error?.message === 'string') return error.message;

  return fallback;
}

export const originContainersService = {
  async findAll(params?: OriginContainerQueryParams): Promise<OriginContainerListResponse> {
    try {
      const response = await api.get('/armazem-geral/containers', { params });
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(toErrorMessage(error, 'Erro ao buscar containers (origem)')));
    }
  },

  async entry(dto: OriginContainerEntryDto): Promise<OperationalContainer> {
    try {
      const response = await api.post('/armazem-geral/containers/entry', dto);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(toErrorMessage(error, 'Erro ao registrar entrada do container')));
    }
  },

  async exit(id: string, dto: OriginContainerExitDto): Promise<OperationalContainer> {
    try {
      const response = await api.post(`/armazem-geral/containers/${id}/exit`, dto);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(toErrorMessage(error, 'Erro ao registrar saída do container')));
    }
  },

  async updateLocation(
    id: string,
    dto: OriginContainerUpdateLocationDto,
  ): Promise<OperationalContainer> {
    try {
      const response = await api.patch(`/armazem-geral/containers/${id}/location`, dto);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(toErrorMessage(error, 'Erro ao atualizar localização do container')));
    }
  },

  async findOne(id: string): Promise<OperationalContainerDetails> {
    try {
      const response = await api.get(`/armazem-geral/containers/${id}`);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(toErrorMessage(error, 'Erro ao buscar container')));
    }
  },

  async movements(id: string): Promise<OperationalContainerMovement[]> {
    try {
      const response = await api.get(`/armazem-geral/containers/${id}/movements`);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(toErrorMessage(error, 'Erro ao buscar movimentações do container')));
    }
  },
};


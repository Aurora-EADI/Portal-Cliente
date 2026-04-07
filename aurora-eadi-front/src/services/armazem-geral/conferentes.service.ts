import { api } from '@/lib/api';
import {
  ConferenteListResponse,
  ConferenteQueryParams,
  CreateConferenteDto,
  UpdateConferenteDto,
  ConferenteResponsavel,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/conferentes';

export const conferentesService = {
  findAll: async (params?: ConferenteQueryParams): Promise<ConferenteListResponse> => {
    const response = await api.get(BASE_PATH, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<ConferenteResponsavel> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: CreateConferenteDto): Promise<ConferenteResponsavel> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },

  update: async (id: string, data: UpdateConferenteDto): Promise<ConferenteResponsavel> => {
    const response = await api.patch(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

import { api } from '@/lib/api';
import {
  OriginContainerEntryDto,
  OriginContainerExitDto,
  OriginContainerListResponse,
  OriginContainerQueryParams,
  OriginContainerUpdateLocationDto,
  UpdateOperationalContainerDto,
  OperationalContainerDetails,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/containers';

export const containersService = {
  findAll: async (params?: OriginContainerQueryParams): Promise<OriginContainerListResponse> => {
    const response = await api.get(BASE_PATH, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<OperationalContainerDetails> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  entry: async (data: OriginContainerEntryDto): Promise<void> => {
    const response = await api.post(`${BASE_PATH}/entry`, data);
    return response.data;
  },

  update: async (id: string, data: UpdateOperationalContainerDto): Promise<void> => {
    const response = await api.patch(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  exit: async (id: string, data: OriginContainerExitDto): Promise<void> => {
    const response = await api.post(`${BASE_PATH}/${id}/exit`, data);
    return response.data;
  },

  updateLocation: async (id: string, data: OriginContainerUpdateLocationDto): Promise<void> => {
    const response = await api.patch(`${BASE_PATH}/${id}/location`, data);
    return response.data;
  },
};

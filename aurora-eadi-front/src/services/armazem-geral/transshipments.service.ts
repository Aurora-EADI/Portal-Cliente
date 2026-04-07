import { api } from '@/lib/api';
import {
  TransshipmentListResponse,
  TransshipmentQueryParams,
  CreateTransshipmentDto,
  CompleteTransshipmentDto,
  UpdateTransshipmentDto,
  WarehouseTransshipment,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/transshipments';

export const transshipmentsService = {
  findAll: async (params?: TransshipmentQueryParams): Promise<TransshipmentListResponse> => {
    const response = await api.get(BASE_PATH, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<WarehouseTransshipment> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: CreateTransshipmentDto): Promise<WarehouseTransshipment> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTransshipmentDto): Promise<WarehouseTransshipment> => {
    const response = await api.put(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  complete: async (id: string, data: CompleteTransshipmentDto): Promise<WarehouseTransshipment> => {
    const response = await api.patch(`${BASE_PATH}/${id}/complete`, data);
    return response.data;
  },
};

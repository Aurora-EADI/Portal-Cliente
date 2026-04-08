import { api } from '@/lib/api';
import {
  CargoListResponse,
  CargoQueryParams,
  CreateWarehouseCargoDto,
  UpdateWarehouseCargoDto,
  WarehouseCargo,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/cargos';

export const cargoService = {
  findAll: async (params?: CargoQueryParams): Promise<CargoListResponse> => {
    const response = await api.get(BASE_PATH, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<WarehouseCargo> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: CreateWarehouseCargoDto): Promise<WarehouseCargo> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },

  update: async (id: string, data: UpdateWarehouseCargoDto): Promise<WarehouseCargo> => {
    const response = await api.patch(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};

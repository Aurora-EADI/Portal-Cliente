import { api } from '@/lib/api';
import {
  OwnedContainerListResponse,
  OwnedContainerQueryParams,
  CreateOwnedContainerDto,
  UpdateOwnedContainerDto,
  WarehouseOwnedContainer,
  WarehouseOwnedContainerSupplier,
  CreateContainerAgSupplierDto,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/containers-proprios';

export const ownedContainersService = {
  findAll: async (params?: OwnedContainerQueryParams): Promise<OwnedContainerListResponse> => {
    const response = await api.get(BASE_PATH, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<WarehouseOwnedContainer> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  getNextCode: async (): Promise<{ code: string }> => {
    const response = await api.get(`${BASE_PATH}/next-code`);
    return response.data;
  },

  create: async (data: CreateOwnedContainerDto): Promise<WarehouseOwnedContainer> => {
    const response = await api.post(BASE_PATH, data);
    return response.data;
  },

  update: async (id: string, data: UpdateOwnedContainerDto): Promise<WarehouseOwnedContainer> => {
    const response = await api.patch(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  dispatch: async (
    id: string,
    data: { 
      customerId: string; 
      notes?: string;
      carrierId?: string;
      driverId?: string;
      vehicleId?: string;
      avarias?: string[];
    },
  ): Promise<WarehouseOwnedContainer> => {
    const response = await api.post(`${BASE_PATH}/${id}/dispatch`, data);
    return response.data;
  },

  returnToPatio: async (
    id: string,
    data: { location?: string; notes?: string },
  ): Promise<WarehouseOwnedContainer> => {
    const response = await api.post(`${BASE_PATH}/${id}/return`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  suppliers: {
    findAll: async (): Promise<WarehouseOwnedContainerSupplier[]> => {
      const response = await api.get(`${BASE_PATH}/suppliers`);
      return response.data;
    },

    create: async (data: CreateContainerAgSupplierDto): Promise<WarehouseOwnedContainerSupplier> => {
      const response = await api.post(`${BASE_PATH}/suppliers`, data);
      return response.data;
    },

    update: async (id: string, data: Partial<CreateContainerAgSupplierDto>): Promise<WarehouseOwnedContainerSupplier> => {
      const response = await api.patch(`${BASE_PATH}/suppliers/${id}`, data);
      return response.data;
    },

    remove: async (id: string): Promise<void> => {
      await api.delete(`${BASE_PATH}/suppliers/${id}`);
    },
  },
};

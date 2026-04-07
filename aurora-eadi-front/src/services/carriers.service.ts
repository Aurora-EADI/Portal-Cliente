import { api } from '@/lib/api';

export interface CarrierDriver {
  id: string;
  carrierId: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarrierVehicle {
  id: string;
  carrierId: string;
  plate: string;
  type: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Carrier {
  id: string;
  name: string;
  cnpj: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  drivers: CarrierDriver[];
  vehicles: CarrierVehicle[];
}

export interface CarriersListResponse {
  data: Carrier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CarriersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export const carriersService = {
  findAll: async (params?: CarriersQueryParams): Promise<CarriersListResponse> => {
    const response = await api.get('/carriers', { params });
    return response.data;
  },

  findOne: async (id: string): Promise<Carrier> => {
    const response = await api.get(`/carriers/${id}`);
    return response.data;
  },
};


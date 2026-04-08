import { api } from '@/lib/api';
import {
  Transportadora,
  TransportadoraListResponse,
  TransportadoraQueryParams,
  CreateTransportadoraDto,
  UpdateTransportadoraDto,
  TransportadoraDriver,
  TransportadoraDriverListResponse,
  CreateTransportadoraDriverDto,
  UpdateTransportadoraDriverDto,
  TransportadoraVehicle,
  TransportadoraVehicleListResponse,
  CreateTransportadoraVehicleDto,
  UpdateTransportadoraVehicleDto,
} from '@/types/armazem-geral';

const BASE = '/armazem-geral/transportadoras';

export const transportadorasService = {
  // ─── Transportadoras ─────────────────────────────────────────────────────
  findAll: async (params?: TransportadoraQueryParams): Promise<TransportadoraListResponse> => {
    const response = await api.get(BASE, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<Transportadora> => {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  create: async (data: CreateTransportadoraDto): Promise<Transportadora> => {
    const response = await api.post(BASE, data);
    return response.data;
  },

  update: async (id: string, data: UpdateTransportadoraDto): Promise<Transportadora> => {
    const response = await api.patch(`${BASE}/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string): Promise<Transportadora> => {
    const response = await api.delete(`${BASE}/${id}`);
    return response.data;
  },

  reactivate: async (id: string): Promise<Transportadora> => {
    const response = await api.patch(`${BASE}/${id}/reativar`);
    return response.data;
  },

  // ─── Motoristas ───────────────────────────────────────────────────────────
  findAllDrivers: async (
    carrierId: string,
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<TransportadoraDriverListResponse> => {
    const response = await api.get(`${BASE}/${carrierId}/motoristas`, { params });
    return response.data;
  },

  createDriver: async (
    carrierId: string,
    data: CreateTransportadoraDriverDto,
  ): Promise<TransportadoraDriver> => {
    const response = await api.post(`${BASE}/${carrierId}/motoristas`, data);
    return response.data;
  },

  updateDriver: async (
    carrierId: string,
    driverId: string,
    data: UpdateTransportadoraDriverDto,
  ): Promise<TransportadoraDriver> => {
    const response = await api.patch(`${BASE}/${carrierId}/motoristas/${driverId}`, data);
    return response.data;
  },

  toggleDriverActive: async (
    carrierId: string,
    driverId: string,
  ): Promise<TransportadoraDriver> => {
    const response = await api.patch(`${BASE}/${carrierId}/motoristas/${driverId}/toggle-ativo`);
    return response.data;
  },

  removeDriver: async (carrierId: string, driverId: string): Promise<void> => {
    await api.delete(`${BASE}/${carrierId}/motoristas/${driverId}`);
  },

  // ─── Veículos ─────────────────────────────────────────────────────────────
  findAllVehicles: async (
    carrierId: string,
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<TransportadoraVehicleListResponse> => {
    const response = await api.get(`${BASE}/${carrierId}/veiculos`, { params });
    return response.data;
  },

  createVehicle: async (
    carrierId: string,
    data: CreateTransportadoraVehicleDto,
  ): Promise<TransportadoraVehicle> => {
    const response = await api.post(`${BASE}/${carrierId}/veiculos`, data);
    return response.data;
  },

  updateVehicle: async (
    carrierId: string,
    vehicleId: string,
    data: UpdateTransportadoraVehicleDto,
  ): Promise<TransportadoraVehicle> => {
    const response = await api.patch(`${BASE}/${carrierId}/veiculos/${vehicleId}`, data);
    return response.data;
  },

  toggleVehicleActive: async (
    carrierId: string,
    vehicleId: string,
  ): Promise<TransportadoraVehicle> => {
    const response = await api.patch(`${BASE}/${carrierId}/veiculos/${vehicleId}/toggle-ativo`);
    return response.data;
  },

  removeVehicle: async (carrierId: string, vehicleId: string): Promise<void> => {
    await api.delete(`${BASE}/${carrierId}/veiculos/${vehicleId}`);
  },
};

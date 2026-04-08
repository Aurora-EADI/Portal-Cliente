import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportadorasService } from '@/services/armazem-geral/transportadoras.service';
import {
  TransportadoraQueryParams,
  CreateTransportadoraDto,
  UpdateTransportadoraDto,
  CreateTransportadoraDriverDto,
  UpdateTransportadoraDriverDto,
  CreateTransportadoraVehicleDto,
  UpdateTransportadoraVehicleDto,
} from '@/types/armazem-geral';

export const TRANSPORTADORA_KEYS = {
  all: ['transportadoras'] as const,
  list: (params: TransportadoraQueryParams) =>
    [...TRANSPORTADORA_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...TRANSPORTADORA_KEYS.all, 'detail', id] as const,
  drivers: (carrierId: string) =>
    [...TRANSPORTADORA_KEYS.all, 'drivers', carrierId] as const,
  vehicles: (carrierId: string) =>
    [...TRANSPORTADORA_KEYS.all, 'vehicles', carrierId] as const,
};

// ─── Transportadoras ─────────────────────────────────────────────────────────

export function useTransportadorasList(params: TransportadoraQueryParams = {}) {
  return useQuery({
    queryKey: TRANSPORTADORA_KEYS.list(params),
    queryFn: () => transportadorasService.findAll(params),
  });
}

export function useTransportadoraDetail(id: string) {
  return useQuery({
    queryKey: TRANSPORTADORA_KEYS.detail(id),
    queryFn: () => transportadorasService.findOne(id),
    enabled: !!id,
  });
}

export function useCreateTransportadora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransportadoraDto) => transportadorasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

export function useUpdateTransportadora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransportadoraDto }) =>
      transportadorasService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.detail(variables.id) });
    },
  });
}

export function useDeactivateTransportadora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportadorasService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

export function useReactivateTransportadora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportadorasService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

// ─── Motoristas ───────────────────────────────────────────────────────────────

export function useDriversList(carrierId: string, params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...TRANSPORTADORA_KEYS.drivers(carrierId), params],
    queryFn: () => transportadorasService.findAllDrivers(carrierId, params),
    enabled: !!carrierId,
  });
}

export function useCreateDriver(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransportadoraDriverDto) =>
      transportadorasService.createDriver(carrierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.drivers(carrierId) });
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

export function useUpdateDriver(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, data }: { driverId: string; data: UpdateTransportadoraDriverDto }) =>
      transportadorasService.updateDriver(carrierId, driverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.drivers(carrierId) });
    },
  });
}

export function useToggleDriverActive(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) =>
      transportadorasService.toggleDriverActive(carrierId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.drivers(carrierId) });
    },
  });
}

export function useRemoveDriver(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) =>
      transportadorasService.removeDriver(carrierId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.drivers(carrierId) });
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

// ─── Veículos ─────────────────────────────────────────────────────────────────

export function useVehiclesList(carrierId: string, params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...TRANSPORTADORA_KEYS.vehicles(carrierId), params],
    queryFn: () => transportadorasService.findAllVehicles(carrierId, params),
    enabled: !!carrierId,
  });
}

export function useCreateVehicle(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransportadoraVehicleDto) =>
      transportadorasService.createVehicle(carrierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.vehicles(carrierId) });
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

export function useUpdateVehicle(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: UpdateTransportadoraVehicleDto }) =>
      transportadorasService.updateVehicle(carrierId, vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.vehicles(carrierId) });
    },
  });
}

export function useToggleVehicleActive(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) =>
      transportadorasService.toggleVehicleActive(carrierId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.vehicles(carrierId) });
    },
  });
}

export function useRemoveVehicle(carrierId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) =>
      transportadorasService.removeVehicle(carrierId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.vehicles(carrierId) });
      queryClient.invalidateQueries({ queryKey: TRANSPORTADORA_KEYS.all });
    },
  });
}

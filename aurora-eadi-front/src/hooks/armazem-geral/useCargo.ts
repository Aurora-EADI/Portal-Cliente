import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cargoService } from '@/services/armazem-geral/cargo.service';
import {
  CargoQueryParams,
  CreateWarehouseCargoDto,
  UpdateWarehouseCargoDto,
} from '@/types/armazem-geral';

export const CARGO_KEYS = {
  all: ['cargo'] as const,
  list: (params: CargoQueryParams) => [...CARGO_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...CARGO_KEYS.all, 'detail', id] as const,
};

export function useCargoList(params: CargoQueryParams) {
  return useQuery({
    queryKey: CARGO_KEYS.list(params),
    queryFn: () => cargoService.findAll(params),
  });
}

export function useCargoDetail(id: string) {
  return useQuery({
    queryKey: CARGO_KEYS.detail(id),
    queryFn: () => cargoService.findOne(id),
    enabled: !!id,
  });
}

export function useCreateCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseCargoDto) => cargoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARGO_KEYS.all });
    },
  });
}

export function useUpdateCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseCargoDto }) =>
      cargoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARGO_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARGO_KEYS.detail(variables.id) });
    },
  });
}

export function useRemoveCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cargoService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARGO_KEYS.all });
    },
  });
}

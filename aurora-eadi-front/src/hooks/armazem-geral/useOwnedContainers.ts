import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownedContainersService } from '@/services/armazem-geral/owned-containers.service';
import {
  OwnedContainerQueryParams,
  CreateOwnedContainerDto,
  UpdateOwnedContainerDto,
  CreateContainerAgSupplierDto,
} from '@/types/armazem-geral';

export const OWNED_CONTAINER_KEYS = {
  all: ['owned-containers'] as const,
  list: (params: OwnedContainerQueryParams) => [...OWNED_CONTAINER_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...OWNED_CONTAINER_KEYS.all, 'detail', id] as const,
  nextCode: () => [...OWNED_CONTAINER_KEYS.all, 'next-code'] as const,
  suppliers: ['owned-containers-suppliers'] as const,
};

export function useOwnedContainersList(params: OwnedContainerQueryParams) {
  return useQuery({
    queryKey: OWNED_CONTAINER_KEYS.list(params),
    queryFn: () => ownedContainersService.findAll(params),
  });
}

export function useOwnedContainerDetail(id: string) {
  return useQuery({
    queryKey: OWNED_CONTAINER_KEYS.detail(id),
    queryFn: () => ownedContainersService.findOne(id),
    enabled: !!id,
  });
}

export function useNextOwnedContainerCode(enabled: boolean = false) {
  return useQuery({
    queryKey: OWNED_CONTAINER_KEYS.nextCode(),
    queryFn: () => ownedContainersService.getNextCode(),
    enabled,
    staleTime: 0, // Always fetch fresh code
  });
}

export function useCreateOwnedContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOwnedContainerDto) => ownedContainersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
    },
  });
}

export function useUpdateOwnedContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOwnedContainerDto }) =>
      ownedContainersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.detail(variables.id) });
    },
  });
}

export function useRemoveOwnedContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ownedContainersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
    },
  });
}

export function useDispatchOwnedContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { 
        customerId: string; 
        notes?: string;
        carrierId?: string;
        driverId?: string;
        vehicleId?: string;
        avarias?: string[];
      };
    }) => ownedContainersService.dispatch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.detail(variables.id) });
    },
  });
}

export function useReturnOwnedContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { location?: string; notes?: string };
    }) => ownedContainersService.returnToPatio(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.detail(variables.id) });
    },
  });
}

// Supplier Hooks
export function useOwnedContainerSuppliers() {
  return useQuery({
    queryKey: OWNED_CONTAINER_KEYS.suppliers,
    queryFn: () => ownedContainersService.suppliers.findAll(),
  });
}

export function useCreateOwnedContainerSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContainerAgSupplierDto) =>
      ownedContainersService.suppliers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.suppliers });
    },
  });
}

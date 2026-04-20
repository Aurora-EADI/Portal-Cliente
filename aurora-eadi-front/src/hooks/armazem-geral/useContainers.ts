import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { containersService } from '@/services/armazem-geral/containers.service';
import {
  OriginContainerQueryParams,
  OriginContainerEntryDto,
  OriginContainerExitDto,
  OriginContainerUpdateLocationDto,
  UpdateOperationalContainerDto,
} from '@/types/armazem-geral';

export const CONTAINERS_KEYS = {
  all: ['containers'] as const,
  list: (params: OriginContainerQueryParams) => [...CONTAINERS_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...CONTAINERS_KEYS.all, 'detail', id] as const,
};

export function useContainersList(params: OriginContainerQueryParams) {
  return useQuery({
    queryKey: CONTAINERS_KEYS.list(params),
    queryFn: () => containersService.findAll(params),
  });
}

export function useContainerDetail(id: string) {
  return useQuery({
    queryKey: CONTAINERS_KEYS.detail(id),
    queryFn: () => containersService.findOne(id),
    enabled: !!id,
  });
}

export function useContainerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OriginContainerEntryDto) => containersService.entry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.all });
    },
  });
}

export function useContainerExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OriginContainerExitDto }) =>
      containersService.exit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.detail(variables.id) });
    },
  });
}

export function useContainerUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OriginContainerUpdateLocationDto }) =>
      containersService.updateLocation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.detail(variables.id) });
    },
  });
}

export function useUpdateContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOperationalContainerDto }) =>
      containersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTAINERS_KEYS.detail(variables.id) });
    },
  });
}

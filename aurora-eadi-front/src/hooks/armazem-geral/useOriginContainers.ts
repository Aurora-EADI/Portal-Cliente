import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  OriginContainerEntryDto,
  OriginContainerExitDto,
  OriginContainerQueryParams,
  OriginContainerUpdateLocationDto,
} from '@/types/armazem-geral';
import { originContainersService } from '@/services/armazem-geral/origin-containers.service';

export const ORIGIN_CONTAINERS_KEY = ['armazem-geral', 'containers-origem'] as const;

export function useOriginContainers(params: OriginContainerQueryParams) {
  return useQuery({
    queryKey: [...ORIGIN_CONTAINERS_KEY, 'list', params],
    queryFn: async () => originContainersService.findAll(params),
  });
}

export function useOriginContainer(id?: string) {
  return useQuery({
    queryKey: [...ORIGIN_CONTAINERS_KEY, 'detail', id],
    queryFn: async () => originContainersService.findOne(id!),
    enabled: !!id,
  });
}

export function useOriginContainerMovements(id?: string) {
  return useQuery({
    queryKey: [...ORIGIN_CONTAINERS_KEY, 'movements', id],
    queryFn: async () => originContainersService.movements(id!),
    enabled: !!id,
  });
}

export function useOriginContainerEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: OriginContainerEntryDto) => originContainersService.entry(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORIGIN_CONTAINERS_KEY });
      toast.success('Entrada registrada com sucesso.');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao registrar entrada.'),
  });
}

export function useOriginContainerExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: OriginContainerExitDto }) =>
      originContainersService.exit(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORIGIN_CONTAINERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ORIGIN_CONTAINERS_KEY, 'detail', variables.id] });
      toast.success('Saída registrada com sucesso.');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao registrar saída.'),
  });
}

export function useOriginContainerUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: OriginContainerUpdateLocationDto;
    }) => originContainersService.updateLocation(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORIGIN_CONTAINERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ORIGIN_CONTAINERS_KEY, 'detail', variables.id] });
      toast.success('Localização atualizada.');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao atualizar localização.'),
  });
}


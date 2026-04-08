import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conferentesService } from '@/services/armazem-geral/conferentes.service';
import {
  ConferenteQueryParams,
  CreateConferenteDto,
  UpdateConferenteDto,
} from '@/types/armazem-geral';

export const CONFERENTE_KEYS = {
  all: ['conferentes'] as const,
  list: (params: ConferenteQueryParams) => [...CONFERENTE_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...CONFERENTE_KEYS.all, 'detail', id] as const,
};

export function useConferentesList(params: ConferenteQueryParams = {}) {
  return useQuery({
    queryKey: CONFERENTE_KEYS.list(params),
    queryFn: () => conferentesService.findAll(params),
  });
}

export function useConferenteDetail(id: string) {
  return useQuery({
    queryKey: CONFERENTE_KEYS.detail(id),
    queryFn: () => conferentesService.findOne(id),
    enabled: !!id,
  });
}

export function useCreateConferente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConferenteDto) => conferentesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFERENTE_KEYS.all });
    },
  });
}

export function useUpdateConferente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConferenteDto }) =>
      conferentesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONFERENTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONFERENTE_KEYS.detail(variables.id) });
    },
  });
}

export function useRemoveConferente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => conferentesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFERENTE_KEYS.all });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transshipmentsService } from '@/services/armazem-geral/transshipments.service';
import { CARGO_KEYS } from './useCargo';
import { CONTAINERS_KEYS } from './useContainers';
import { OWNED_CONTAINER_KEYS } from './useOwnedContainers';
import { ORIGIN_CONTAINERS_KEY } from './useOriginContainers';
import {
  TransshipmentQueryParams,
  CreateTransshipmentDto,
  CompleteTransshipmentDto,
  UpdateTransshipmentDto,
} from '@/types/armazem-geral';

export const TRANSSHIPMENT_KEYS = {
  all: ['transshipments'] as const,
  list: (params: TransshipmentQueryParams) => [...TRANSSHIPMENT_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...TRANSSHIPMENT_KEYS.all, 'detail', id] as const,
};

export function useTransshipmentsList(params: TransshipmentQueryParams) {
  return useQuery({
    queryKey: TRANSSHIPMENT_KEYS.list(params),
    queryFn: () => transshipmentsService.findAll(params),
  });
}

export function useTransshipmentDetail(id: string) {
  return useQuery({
    queryKey: TRANSSHIPMENT_KEYS.detail(id),
    queryFn: () => transshipmentsService.findOne(id),
    enabled: !!id,
  });
}

export function useCreateTransshipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransshipmentDto) => transshipmentsService.create(data),
    onSuccess: (_, variables) => {
      // Invalidate transshipments
      queryClient.invalidateQueries({ queryKey: TRANSSHIPMENT_KEYS.all });
      
      // Reset and refetch cargo (both list and the specific detail involved)
      // Reset is more aggressive as it clears the current UI data until fresh data is fetched
      queryClient.resetQueries({ queryKey: CARGO_KEYS.all });
      if (variables.cargoId) {
        queryClient.resetQueries({ queryKey: CARGO_KEYS.detail(variables.cargoId) });
      }
      
      // Reset and reset containers to ensure fresh status
      queryClient.resetQueries({ queryKey: CONTAINERS_KEYS.all });
      queryClient.resetQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
      queryClient.resetQueries({ queryKey: ORIGIN_CONTAINERS_KEY });
      
      // Force immediate refetch for any observers (even if inactive/unmounted)
      queryClient.refetchQueries({ queryKey: CARGO_KEYS.all });
    },
  });
}

export function useCompleteTransshipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteTransshipmentDto }) =>
      transshipmentsService.complete(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSSHIPMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSSHIPMENT_KEYS.detail(variables.id) });
      
      // Reset cargo and containers on completion
      queryClient.resetQueries({ queryKey: CARGO_KEYS.all });
      queryClient.resetQueries({ queryKey: CONTAINERS_KEYS.all });
      queryClient.resetQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
      queryClient.resetQueries({ queryKey: ORIGIN_CONTAINERS_KEY });
      
      // Force immediate update for UI components
      queryClient.refetchQueries({ queryKey: CARGO_KEYS.all });
      queryClient.refetchQueries({ queryKey: CONTAINERS_KEYS.all });
    },
  });
}

export function useUpdateTransshipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransshipmentDto }) =>
      transshipmentsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSSHIPMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSSHIPMENT_KEYS.detail(variables.id) });
      
      // Reset cargo and containers if anything changed
      queryClient.resetQueries({ queryKey: CARGO_KEYS.all });
      queryClient.resetQueries({ queryKey: CONTAINERS_KEYS.all });
      queryClient.resetQueries({ queryKey: OWNED_CONTAINER_KEYS.all });
      queryClient.resetQueries({ queryKey: ORIGIN_CONTAINERS_KEY });
      
      // Force update
      queryClient.refetchQueries({ queryKey: CARGO_KEYS.all });
    },
  });
}

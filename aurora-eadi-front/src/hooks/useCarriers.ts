import { useQuery } from '@tanstack/react-query';
import { carriersService, type CarriersQueryParams } from '@/services/carriers.service';

export const CARRIERS_KEY = ['carriers'] as const;

export function useCarriers(params?: CarriersQueryParams) {
  return useQuery({
    queryKey: [...CARRIERS_KEY, params],
    queryFn: async () => carriersService.findAll(params),
  });
}


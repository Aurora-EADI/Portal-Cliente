import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, PaginationParams } from '../services/api';
import { CompanyStatus } from '../types';

export const SUPPLIERS_KEY = ['suppliers'];

export const useSuppliers = (params?: PaginationParams) => {
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, params],
    queryFn: async () => {
      return await companyService.getAllWithResponsible(params);
    },
  });
};

export const useActiveCompanies = (params?: PaginationParams) => {
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, 'active', params],
    queryFn: async () => {
      return await companyService.getActiveCompanies(params);
    },
  });
};

export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) => {
      return await companyService.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });
    },
  });
};
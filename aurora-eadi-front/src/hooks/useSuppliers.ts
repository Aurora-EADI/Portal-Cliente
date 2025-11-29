import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../services/api';
import { CompanyStatus } from '../types';

export const SUPPLIERS_KEY = ['suppliers'];

export const useSuppliers = () => {
  return useQuery({
    queryKey: SUPPLIERS_KEY,
    queryFn: async () => {
      return await companyService.getAllWithResponsible();
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, PaginationParams } from '../services/api';
import { CompanyStatus } from '../types';
import { toast } from 'sonner';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY });

      if (variables.status === CompanyStatus.ACTIVE) {
        toast.success('Empresa aprovada com sucesso!');
      } else if (variables.status === CompanyStatus.REJECTED) {
        toast.success('Empresa bloqueada.');
      }
    },
  });
};

export const useSuppliersByType = (typeName: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, 'by-type', typeName, params],
    queryFn: async () => {
      return await companyService.getActiveCompanies({
        ...params,
        supplierTypeName: typeName,
      });
    },
    enabled: !!typeName,
  });
};
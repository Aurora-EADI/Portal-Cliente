import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, PaginationParams } from '../services/api';
import { CustomerStatus, CreateCustomerDTO, UpdateCustomerDTO } from '../types';
import { toast } from 'sonner';

export const CUSTOMERS_KEY = ['customers'];

export const useCustomers = (params?: PaginationParams) => {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, params],
    queryFn: async () => {
      return await customerService.getAll(params);
    },
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, id],
    queryFn: async () => {
      return await customerService.getById(id);
    },
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerDTO) => {
      return await customerService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar cliente');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerDTO }) => {
      return await customerService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar cliente');
    },
  });
};

export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CustomerStatus }) => {
      return await customerService.updateStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });

      if (variables.status === CustomerStatus.ACTIVE) {
        toast.success('Cliente ativado com sucesso!');
      } else if (variables.status === CustomerStatus.INACTIVE) {
        toast.success('Cliente desativado.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await customerService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir cliente');
    },
  });
};

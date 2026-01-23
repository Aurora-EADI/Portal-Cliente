import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService, serviceCostService } from '@/services/serviceService';
import { CreateServiceDto, UpdateServiceDto, CreateServiceCostDto } from '@/types';
import { toast } from 'sonner';

// Query Keys
export const SERVICES_KEY = ['services'];
export const SERVICE_COSTS_KEY = ['service-costs'];

/**
 * Hook para buscar todos os serviços
 */
export const useServices = (includeInactive = false) => {
  return useQuery({
    queryKey: [...SERVICES_KEY, includeInactive],
    queryFn: () => serviceService.getAll(includeInactive),
  });
};

/**
 * Hook para buscar um serviço por ID
 */
export const useService = (id: string) => {
  return useQuery({
    queryKey: [...SERVICES_KEY, id],
    queryFn: () => serviceService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para buscar custo vigente de um serviço
 */
export const useServiceCurrentCost = (id: string) => {
  return useQuery({
    queryKey: [...SERVICES_KEY, id, 'current-cost'],
    queryFn: () => serviceService.getCurrentCost(id),
    enabled: !!id,
  });
};

/**
 * Hook para criar um novo serviço
 */
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceDto) => serviceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para atualizar um serviço
 */
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceDto }) =>
      serviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para desativar um serviço
 */
export const useRemoveService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço desativado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// ========== SERVICE COSTS ==========

/**
 * Hook para criar um novo custo de serviço
 */
export const useCreateServiceCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceCostDto) => serviceCostService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_COSTS_KEY });
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Custo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para buscar histórico de custos de um serviço
 */
export const useServiceCostsHistory = (serviceId: string) => {
  return useQuery({
    queryKey: [...SERVICE_COSTS_KEY, 'by-service', serviceId],
    queryFn: () => serviceCostService.getByService(serviceId),
    enabled: !!serviceId,
  });
};

/**
 * Hook para buscar custo vigente de um serviço
 */
export const useServiceCostCurrent = (serviceId: string) => {
  return useQuery({
    queryKey: [...SERVICE_COSTS_KEY, 'current', serviceId],
    queryFn: () => serviceCostService.getCurrent(serviceId),
    enabled: !!serviceId,
  });
};

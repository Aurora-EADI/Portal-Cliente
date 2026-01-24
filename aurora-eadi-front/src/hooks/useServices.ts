import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceService, serviceCostService } from '@/services/serviceService';
import { CreateServiceDto, UpdateServiceDto, CreateServiceCostDto } from '@/types';
import { toast } from 'sonner';

// Manutenção das chaves consistentes para evitar bugs de cache
export const SERVICES_KEY = ['services'];
export const SERVICE_COSTS_KEY = ['service-costs'];

/**
 * Hook para buscar serviços com filtros de modalidade (AIR, MARITIME, BOTH)
 */
export const useServices = (includeInactive = false, modal?: 'AIR' | 'MARITIME' | 'BOTH') => {
  return useQuery({
    queryKey: [...SERVICES_KEY, includeInactive, modal],
    queryFn: () => serviceService.getAll(includeInactive, modal), // Agora suporta modal
  });
};

/**
 * Hooks especializados para facilitar o uso em telas específicas
 */
export const useAirServices = (includeInactive = false) => {
  return useQuery({
    queryKey: [...SERVICES_KEY, 'air', includeInactive],
    queryFn: () => serviceService.getAirServices(includeInactive),
  });
};

export const useMaritimeServices = (includeInactive = false) => {
  return useQuery({
    queryKey: [...SERVICES_KEY, 'maritime', includeInactive],
    queryFn: () => serviceService.getMaritimeServices(includeInactive),
  });
};

/**
 * Hook para buscar um serviço por ID (Mantendo a chave padronizada)
 */
export const useService = (id: string) => {
  return useQuery({
    queryKey: [...SERVICES_KEY, id],
    queryFn: () => serviceService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para criar um novo serviço (Com tratamento de erro aprimorado)
 */
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceDto) => serviceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço criado com sucesso!');
    },
    onError: (error: any) => {
      // Captura a mensagem do backend se disponível
      const message = error.response?.data?.message || error.message || 'Erro ao criar serviço';
      toast.error(message);
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceDto }) =>
      serviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erro ao atualizar';
      toast.error(message);
    },
  });
};

/**
 * Reativação de serviço (Compatível com os dois modelos)
 */
export const useActivateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      // Tenta usar o método .activate() se existir, senão usa o .update()
      serviceService.activate ? serviceService.activate(id) : serviceService.update(id, { isActive: true } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço reativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao reativar serviço');
    },
  });
};

// ========== SERVICE COSTS (Preservando Histórico e Tipagem) ==========

export const useCreateServiceCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceCostDto) => serviceCostService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_COSTS_KEY });
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Custo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar custo');
    },
  });
};

export const useRemoveService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      toast.success('Serviço removido/desativado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erro ao remover serviço';
      toast.error(message);
    },
  });
};

/**
 * VITAL: Mantido o histórico que seria perdido no novo código
 */
export const useServiceCostsHistory = (serviceId: string) => {
  return useQuery({
    queryKey: [...SERVICE_COSTS_KEY, 'by-service', serviceId],
    queryFn: () => serviceCostService.getByService(serviceId),
    enabled: !!serviceId,
  });
};

export const useServiceCostCurrent = (serviceId: string) => {
  return useQuery({
    queryKey: [...SERVICE_COSTS_KEY, 'current', serviceId],
    queryFn: () => serviceCostService.getCurrent(serviceId),
    enabled: !!serviceId,
  });
};
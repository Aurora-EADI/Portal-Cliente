import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simulationService } from '@/services/simulationService';
import {
  CreateSimulationDto,
  UpdateSimulationDto,
  CreateNewVersionDto,
  AddSimulationServiceDto,
  SimulationStatus,
} from '@/types';
import { toast } from 'sonner';

// Query Keys
export const SIMULATIONS_KEY = ['simulations'];
export const SIMULATION_SERVICES_KEY = ['simulation-services'];

/**
 * Hook para buscar todas as simulações
 */
export const useSimulations = (supplierId?: string) => {
  return useQuery({
    queryKey: supplierId ? [...SIMULATIONS_KEY, supplierId] : SIMULATIONS_KEY,
    queryFn: () => simulationService.getAll(supplierId),
  });
};

/**
 * Hook para buscar uma simulação por ID
 */
export const useSimulation = (id: string | null) => {
  return useQuery({
    queryKey: [...SIMULATIONS_KEY, id],
    queryFn: () => simulationService.getById(id!),
    enabled: !!id,
  });
};

/**
 * Hook para buscar histórico de versões de uma simulação
 */
export const useSimulationVersionHistory = (simulationNumber: string) => {
  return useQuery({
    queryKey: [...SIMULATIONS_KEY, 'version-history', simulationNumber],
    queryFn: () => simulationService.getVersionHistory(simulationNumber),
    enabled: !!simulationNumber,
  });
};

/**
 * Hook para criar uma nova simulação (V1)
 */
export const useCreateSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSimulationDto) => simulationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
      toast.success('Simulação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para criar uma nova versão de uma simulação
 */
export const useCreateSimulationVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNewVersionDto) => simulationService.createNewVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
      toast.success('Nova versão criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para atualizar uma simulação
 */
export const useUpdateSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSimulationDto }) =>
      simulationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SIMULATIONS_KEY, variables.id] });
      toast.success('Simulação atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para deletar uma simulação
 */
export const useDeleteSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => simulationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
      toast.success('Simulação deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// ========== APROVAÇÃO E VALIDAÇÃO ==========

/**
 * Hook para aprovar uma simulação (marítima)
 */
export const useApproveSimulation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      simulationService.update(id, { status: SimulationStatus.APPROVED }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
      toast.success('Simulação aprovada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao aprovar simulação.');
    },
  });
};

/**
 * Hook para alterar o status de uma simulação para qualquer valor manual
 */
export const useChangeSimulationStatus = () => {
  const queryClient = useQueryClient();
  const statusLabels: Partial<Record<SimulationStatus, string>> = {
    [SimulationStatus.APPROVED]:     'Simulação aprovada com sucesso!',
    [SimulationStatus.SENT]:     'Simulação marcada como Enviada!',
    [SimulationStatus.ACCEPTED]: 'Simulação marcada como Aceita!',
    [SimulationStatus.REJECTED]: 'Simulação marcada como Rejeitada!',
    [SimulationStatus.DRAFT]:    'Simulação revertida para Rascunho!',
  };
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SimulationStatus }) =>
      simulationService.update(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
      toast.success(statusLabels[variables.status] || 'Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status.');
    },
  });
};

/**
 * Hook para iniciar a validação de uma simulação (Pendente → Em Validação)
 */
export const useStartSimulationValidation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      simulationService.update(id, { status: SimulationStatus.IN_VALIDATION }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIMULATIONS_KEY });
    },
  });
};

// ========== GERENCIAMENTO DE SERVIÇOS ==========

/**
 * Hook para buscar serviços de uma simulação
 */
export const useSimulationServices = (simulationId: string | null) => {
  return useQuery({
    queryKey: [...SIMULATION_SERVICES_KEY, simulationId],
    queryFn: () => simulationService.getServices(simulationId!),
    enabled: !!simulationId,
  });
};

/**
 * Hook para adicionar/atualizar um serviço na simulação
 */
export const useAddSimulationService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ simulationId, data }: { simulationId: string; data: AddSimulationServiceDto }) =>
      simulationService.addService(simulationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SIMULATION_SERVICES_KEY, variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: [...SIMULATIONS_KEY, variables.simulationId] });
      toast.success('Serviço adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para remover um serviço da simulação
 */
export const useRemoveSimulationService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ simulationId, serviceId }: { simulationId: string; serviceId: string }) =>
      simulationService.removeService(simulationId, serviceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SIMULATION_SERVICES_KEY, variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: [...SIMULATIONS_KEY, variables.simulationId] });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

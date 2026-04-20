import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { airSimulationService } from '@/services/airSimulationService';
import {
  CreateAirSimulationDto,
  UpdateAirSimulationDto,
  CreateAirNewVersionDto,
  AddAirSimulationServiceDto,
} from '@/types/air-simulation';
import { SimulationStatus } from '@/types/simulation';
import { toast } from 'sonner';

// Query Keys
export const AIR_SIMULATIONS_KEY = ['air-simulations'];
export const AIR_SIMULATION_SERVICES_KEY = ['air-simulation-services'];

/**
 * Hook para buscar todas as simulações aéreas
 */
export const useAirSimulations = (customerId?: string) => {
  return useQuery({
    queryKey: customerId ? [...AIR_SIMULATIONS_KEY, customerId] : AIR_SIMULATIONS_KEY,
    queryFn: () => airSimulationService.getAll(customerId),
  });
};

/**
 * Hook para buscar uma simulação aérea por ID
 */
export const useAirSimulation = (id: string | null) => {
  return useQuery({
    queryKey: [...AIR_SIMULATIONS_KEY, id],
    queryFn: () => airSimulationService.getById(id!),
    enabled: !!id,
  });
};

/**
 * Hook para buscar histórico de versões de uma simulação aérea
 */
export const useAirSimulationVersionHistory = (simulationNumber: string) => {
  return useQuery({
    queryKey: [...AIR_SIMULATIONS_KEY, 'version-history', simulationNumber],
    queryFn: () => airSimulationService.getVersionHistory(simulationNumber),
    enabled: !!simulationNumber,
  });
};

/**
 * Hook para criar uma nova simulação aérea (V1)
 */
export const useCreateAirSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAirSimulationDto) => airSimulationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
      toast.success('Simulação aérea criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para criar uma nova versão de uma simulação aérea
 */
export const useCreateAirSimulationVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAirNewVersionDto) => airSimulationService.createNewVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
      toast.success('Nova versão criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para atualizar uma simulação aérea
 */
export const useUpdateAirSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAirSimulationDto }) =>
      airSimulationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...AIR_SIMULATIONS_KEY, variables.id] });
      toast.success('Simulação aérea atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para deletar uma simulação aérea
 */
export const useDeleteAirSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => airSimulationService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
      toast.success('Simulação aérea deletada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// ========== APROVAÇÃO E VALIDAÇÃO ==========

/**
 * Hook para aprovar uma simulação aérea
 */
export const useApproveAirSimulation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      airSimulationService.update(id, { status: SimulationStatus.APPROVED }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
      toast.success('Simulação aérea aprovada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao aprovar simulação aérea.');
    },
  });
};

/**
 * Hook para alterar o status de uma simulação aérea para qualquer valor manual
 */
export const useChangeAirSimulationStatus = () => {
  const queryClient = useQueryClient();
  const statusLabels: Partial<Record<SimulationStatus, string>> = {
    [SimulationStatus.APPROVED]:     'Simulação aérea aprovada com sucesso!',
    [SimulationStatus.SENT]:     'Simulação aérea marcada como Enviada!',
    [SimulationStatus.ACCEPTED]: 'Simulação aérea marcada como Aceita!',
    [SimulationStatus.REJECTED]: 'Simulação aérea marcada como Rejeitada!',
    [SimulationStatus.DRAFT]:    'Simulação aérea revertida para Rascunho!',
  };
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SimulationStatus }) =>
      airSimulationService.update(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
      toast.success(statusLabels[variables.status] || 'Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status.');
    },
  });
};

/**
 * Hook para iniciar a validação de uma simulação aérea (Pendente → Em Validação)
 */
export const useStartAirSimulationValidation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      airSimulationService.update(id, { status: SimulationStatus.IN_VALIDATION }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AIR_SIMULATIONS_KEY });
    },
  });
};

// ========== GERENCIAMENTO DE SERVIÇOS ==========

/**
 * Hook para buscar serviços de uma simulação aérea
 */
export const useAirSimulationServices = (simulationId: string | null) => {
  return useQuery({
    queryKey: [...AIR_SIMULATION_SERVICES_KEY, simulationId],
    queryFn: () => airSimulationService.getServices(simulationId!),
    enabled: !!simulationId,
  });
};

/**
 * Hook para adicionar/atualizar um serviço na simulação aérea
 */
export const useAddAirSimulationService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ simulationId, data }: { simulationId: string; data: AddAirSimulationServiceDto }) =>
      airSimulationService.addService(simulationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...AIR_SIMULATION_SERVICES_KEY, variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: [...AIR_SIMULATIONS_KEY, variables.simulationId] });
      toast.success('Serviço adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook para remover um serviço da simulação aérea
 */
export const useRemoveAirSimulationService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ simulationId, serviceId }: { simulationId: string; serviceId: string }) =>
      airSimulationService.removeService(simulationId, serviceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...AIR_SIMULATION_SERVICES_KEY, variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: [...AIR_SIMULATIONS_KEY, variables.simulationId] });
      toast.success('Serviço removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ccteService } from '@/services/ccteService';
import {
  CreateFlightDto,
  UpdateFlightDto,
  CreateCargoItemsDto,
  UpdateCargoItemDto,
  RevertFlightDto,
} from '@/types/ccte';
import { toast } from 'sonner';

export const CCTE_FLIGHTS_KEY = ['ccte-flights'];
export const CCTE_FLIGHT_DETAIL_KEY = ['ccte-flight-detail'];
export const CCTE_FLIGHT_HISTORY_KEY = ['ccte-flight-history'];

// ========== FLIGHT QUERIES ==========

export const useFlights = (search?: string, status?: string) => {
  return useQuery({
    queryKey: [...CCTE_FLIGHTS_KEY, { search, status }],
    queryFn: () => ccteService.getAll(search, status),
  });
};

export const useFlight = (id: string | null) => {
  return useQuery({
    queryKey: [...CCTE_FLIGHT_DETAIL_KEY, id],
    queryFn: () => ccteService.getById(id!),
    enabled: !!id,
  });
};

export const useFlightHistory = (id: string | null) => {
  return useQuery({
    queryKey: [...CCTE_FLIGHT_HISTORY_KEY, id],
    queryFn: () => ccteService.getHistory(id!),
    enabled: !!id,
  });
};

// ========== FLIGHT MUTATIONS ==========

export const useCreateFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlightDto) => ccteService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      toast.success('Voo criado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlightDto }) =>
      ccteService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_HISTORY_KEY, variables.id],
      });
      toast.success('Voo atualizado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ccteService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.removeQueries({ queryKey: [...CCTE_FLIGHT_DETAIL_KEY, id] });
      queryClient.removeQueries({ queryKey: [...CCTE_FLIGHT_HISTORY_KEY, id] });
      toast.success('Voo excluido com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useMarkFlightSent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ccteService.markSent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, id],
      });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_HISTORY_KEY, id],
      });
      toast.success('Voo marcado como enviado!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useRevertFlight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RevertFlightDto }) =>
      ccteService.revert(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_HISTORY_KEY, variables.id],
      });
      toast.success('Voo revertido para operacao!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// ========== CARGO ITEM MUTATIONS ==========

export const useCreateCargoItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      flightId,
      data,
    }: {
      flightId: string;
      data: CreateCargoItemsDto;
    }) => ccteService.createCargoItems(flightId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, variables.flightId],
      });
      toast.success('Cargas adicionadas com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateCargoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, flightId }: { id: string; data: UpdateCargoItemDto; flightId: string }) =>
      ccteService.updateCargoItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, variables.flightId],
      });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_HISTORY_KEY, variables.flightId],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteCargoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flightId }: { id: string; flightId: string }) =>
      ccteService.deleteCargoItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, variables.flightId],
      });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_HISTORY_KEY, variables.flightId],
      });
      toast.success('Carga excluida com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useSendCargoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flightId }: { id: string; flightId: string }) =>
      ccteService.sendCargoItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CCTE_FLIGHTS_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_DETAIL_KEY, variables.flightId],
      });
      queryClient.invalidateQueries({
        queryKey: [...CCTE_FLIGHT_HISTORY_KEY, variables.flightId],
      });
      toast.success('Carga enviada com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

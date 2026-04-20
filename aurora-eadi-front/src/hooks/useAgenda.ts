import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agendaService } from '@/services/recepcao/agenda.service';
import { AgendaFilters, VisitanteStatus } from '@/types/visitantes';
import { toast } from 'sonner';

export const AGENDA_KEY = ['agenda'];
export const AGENDA_SUMMARY_KEY = ['agenda', 'summary'];

export const useAgenda = (filters?: AgendaFilters) => {
  return useQuery({
    queryKey: [...AGENDA_KEY, filters],
    queryFn: () => agendaService.findAll(filters),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

export const useAgendaSummary = (dataInicio?: string, dataFim?: string) => {
  return useQuery({
    queryKey: [...AGENDA_SUMMARY_KEY, dataInicio, dataFim],
    queryFn: () => agendaService.findSummary(dataInicio, dataFim),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

export const useUpdateVisitanteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitanteStatus }) =>
      agendaService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AGENDA_KEY });
      queryClient.invalidateQueries({ queryKey: AGENDA_SUMMARY_KEY });
      const label =
        variables.status === VisitanteStatus.PRESENTE
          ? 'Presença confirmada com sucesso!'
          : 'Não comparecimento registrado.';
      toast.success(label);
    },
    onError: () => {
      toast.error('Erro ao atualizar status do visitante.');
    },
  });
};

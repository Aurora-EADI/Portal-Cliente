'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { procuracoesService } from '@/services/procuracoes.service';

export const PROCURACAO_KEYS = {
  all: ['procuracoes'] as const,
  list: () => [...PROCURACAO_KEYS.all, 'list'] as const,
  clientesDisponiveis: () =>
    [...PROCURACAO_KEYS.all, 'clientes-disponiveis'] as const,
};

export function useProcuracoes() {
  return useQuery({
    queryKey: PROCURACAO_KEYS.list(),
    queryFn: () => procuracoesService.listar(),
  });
}

export function useClientesDisponiveis() {
  return useQuery({
    queryKey: PROCURACAO_KEYS.clientesDisponiveis(),
    queryFn: () => procuracoesService.clientesDisponiveis(),
  });
}

export function useEnviarProcuracao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, arquivo }: { clienteId: string; arquivo: File }) =>
      procuracoesService.enviar(clienteId, arquivo),
    onSuccess: () => {
      // Invalida as duas: enviar tira o cliente da lista de disponíveis.
      queryClient.invalidateQueries({ queryKey: PROCURACAO_KEYS.all });
    },
  });
}

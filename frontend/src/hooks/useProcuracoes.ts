'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { procuracoesService } from '@/services/procuracoes.service';

export const PROCURACAO_KEYS = {
  all: ['procuracoes'] as const,
  representados: () => [...PROCURACAO_KEYS.all, 'representados'] as const,
};

export function useRepresentados() {
  return useQuery({
    queryKey: PROCURACAO_KEYS.representados(),
    queryFn: () => procuracoesService.representados(),
  });
}

export function useEnviarProcuracao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clienteId,
      arquivo,
      validade,
    }: {
      clienteId: string;
      arquivo: File;
      validade?: string;
    }) => procuracoesService.enviar(clienteId, arquivo, validade),
    onSuccess: () => {
      // Enviar muda a situação do cliente e libera averbação: invalida tudo.
      queryClient.invalidateQueries({ queryKey: PROCURACAO_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['averbacoes'] });
    },
  });
}

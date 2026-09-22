'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiNest } from '@/lib/apiNest';
import { connectEventStream } from '@/lib/event-stream';
import { AVERBACAO_KEYS } from '@/hooks/useAverbacoes';
import { ProcessoStatus } from '@/types/averbacao';

interface AverbacaoAlterada {
  processoId: string;
  clienteId: string;
  status: ProcessoStatus;
}

const AVISO: Partial<Record<ProcessoStatus, (t: typeof toast) => void>> = {
  [ProcessoStatus.LIBERADO_AGENDAMENTO]: (t) =>
    t.success('Uma averbação foi liberada para agendamento pela equipe Aurora.'),
};

/**
 * Mantém a tela de Averbação Aduaneira em dia com a análise da equipe Aurora,
 * que acontece em outro sistema. O evento só diz "mudou": a lista e o detalhe
 * são relidos pelo GET, que continua sendo a fonte de verdade.
 */
export function useAverbacoesStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return connectEventStream<AverbacaoAlterada>(
      `${apiNest.defaults.baseURL}/averbacoes/stream`,
      (evento) => {
        queryClient.invalidateQueries({ queryKey: AVERBACAO_KEYS.all });
        AVISO[evento.status]?.(toast);
      },
      { withCredentials: true },
    );
  }, [queryClient]);
}

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiNest } from '@/lib/apiNest';
import { connectEventStream } from '@/lib/event-stream';
import { PROCURACAO_KEYS } from '@/hooks/useProcuracoes';
import { ProcuracaoStatus } from '@/types/procuracao';

interface ProcuracaoAlterada {
  procuracaoId: string;
  clienteId: string;
  status: ProcuracaoStatus;
}

const AVISO: Partial<Record<ProcuracaoStatus, (t: typeof toast) => void>> = {
  [ProcuracaoStatus.APROVADA]: (t) =>
    t.success('Uma procuração foi aprovada pela equipe Aurora.'),
  [ProcuracaoStatus.REPROVADA]: (t) =>
    t.error('Uma procuração foi reprovada. Veja o motivo na lista.'),
  [ProcuracaoStatus.REVOGADA]: (t) =>
    t.error('Uma procuração foi revogada. Veja o motivo na lista.'),
};

/**
 * Mantém a tela de Procurações em dia com a análise da equipe Aurora, que
 * acontece em outro sistema. O evento só diz "mudou": a lista é relida pelo
 * GET, que continua sendo a fonte de verdade.
 */
export function useProcuracoesStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return connectEventStream<ProcuracaoAlterada>(
      `${apiNest.defaults.baseURL}/procuracoes/stream`,
      (evento) => {
        queryClient.invalidateQueries({ queryKey: PROCURACAO_KEYS.all });
        // Aprovar ou revogar muda quem pode ser escolhido na Nova Averbação.
        queryClient.invalidateQueries({ queryKey: ['averbacoes'] });
        AVISO[evento.status]?.(toast);
      },
      { withCredentials: true },
    );
  }, [queryClient]);
}

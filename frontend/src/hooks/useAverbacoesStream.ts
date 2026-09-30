'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiNest } from '@/lib/apiNest';
import { connectEventStream } from '@/lib/event-stream';
import { AVERBACAO_KEYS } from '@/hooks/useAverbacoes';
import { DocumentoStatus, ProcessoStatus } from '@/types/averbacao';

interface AverbacaoAlterada {
  processoId: string;
  clienteId: string;
  status: ProcessoStatus;
  /** Presente quando o evento é a decisão de um documento pela Aurora. */
  documentoStatus?: DocumentoStatus;
  /** A Aurora devolveu o processo para o despachante corrigir os dados. */
  devolvido?: boolean;
}

const AVISO: Partial<Record<ProcessoStatus, (t: typeof toast) => void>> = {
  [ProcessoStatus.LIBERADO_AGENDAMENTO]: (t) =>
    t.success('Uma averbação foi liberada para agendamento pela equipe Aurora.'),
};

const AVISO_DOCUMENTO: Partial<
  Record<DocumentoStatus, (t: typeof toast) => void>
> = {
  [DocumentoStatus.VALIDADO]: (t) =>
    t.success('Um documento foi aprovado pela equipe Aurora.'),
  [DocumentoStatus.REJEITADO]: (t) =>
    t.error('Um documento foi recusado pela equipe Aurora. Veja o motivo no processo.'),
};

/**
 * Mantém a tela de Averbação Aduaneira em dia com a análise da equipe Aurora,
 * que acontece em outro sistema — aprovação/recusa de documento e liberação. O
 * evento só diz "mudou": a lista e o detalhe são relidos pelo GET, que continua
 * sendo a fonte de verdade.
 */
export function useAverbacoesStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return connectEventStream<AverbacaoAlterada>(
      `${apiNest.defaults.baseURL}/averbacoes/stream`,
      (evento) => {
        queryClient.invalidateQueries({ queryKey: AVERBACAO_KEYS.all });
        if (evento.devolvido) {
          toast.error(
            'Um processo foi devolvido pela equipe Aurora para correção. Veja o motivo no processo.',
          );
        } else if (evento.documentoStatus) {
          AVISO_DOCUMENTO[evento.documentoStatus]?.(toast);
        } else {
          AVISO[evento.status]?.(toast);
        }
      },
      { withCredentials: true },
    );
  }, [queryClient]);
}

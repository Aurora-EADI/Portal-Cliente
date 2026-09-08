'use client';

import { AlertCircle, CheckCircle2, Clock, FileUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  DOCUMENTO_STATUS_LABEL,
  DocumentoStatus,
  PROCESSO_STATUS_LABEL,
  ProcessoStatus,
} from '@/types/averbacao';

const PROCESSO: Record<
  ProcessoStatus,
  'success' | 'warning' | 'danger' | 'secondary'
> = {
  [ProcessoStatus.LIBERADO_AGENDAMENTO]: 'success',
  [ProcessoStatus.EM_ANALISE]: 'warning',
  [ProcessoStatus.PENDENTE_CORRECAO]: 'danger',
  [ProcessoStatus.RASCUNHO]: 'secondary',
};

const DOCUMENTO: Record<
  DocumentoStatus,
  { variant: 'success' | 'warning' | 'danger' | 'secondary'; Icon: typeof Clock }
> = {
  [DocumentoStatus.VALIDADO]: { variant: 'success', Icon: CheckCircle2 },
  [DocumentoStatus.EM_ANALISE]: { variant: 'warning', Icon: Clock },
  [DocumentoStatus.REJEITADO]: { variant: 'danger', Icon: AlertCircle },
  [DocumentoStatus.NAO_ENVIADO]: { variant: 'secondary', Icon: FileUp },
};

export function StatusProcesso({ status }: { status: ProcessoStatus }) {
  return (
    <Badge variant={PROCESSO[status]}>{PROCESSO_STATUS_LABEL[status]}</Badge>
  );
}

export function StatusDocumento({ status }: { status: DocumentoStatus }) {
  const { variant, Icon } = DOCUMENTO[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {DOCUMENTO_STATUS_LABEL[status]}
    </Badge>
  );
}

/** Barra de obrigatórios validados — o que decide a liberação. */
export function ProgressoObrigatorios({
  validados,
  total,
}: {
  validados: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((validados / total) * 100);
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Obrigatórios validados</span>
        <span className="font-mono">
          {validados}/{total}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            pct === 100
              ? 'h-full rounded-full bg-emerald-500 transition-all'
              : 'h-full rounded-full bg-primary transition-all'
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

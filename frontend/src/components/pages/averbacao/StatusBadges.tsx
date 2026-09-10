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

export enum ProcuracaoStatus {
  PENDENTE_ENVIO = 'PENDENTE_ENVIO',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA',
}

export const PROCURACAO_STATUS_LABEL: Record<ProcuracaoStatus, string> = {
  [ProcuracaoStatus.PENDENTE_ENVIO]: 'Aguardando envio',
  [ProcuracaoStatus.EM_ANALISE]: 'Em análise',
  [ProcuracaoStatus.APROVADA]: 'Aprovada',
  [ProcuracaoStatus.REPROVADA]: 'Reprovada',
};

export interface ClienteResumo {
  id: string;
  nome: string;
  cnpj: string | null;
}

export interface Procuracao {
  id: string;
  status: ProcuracaoStatus;
  arquivoNome: string | null;
  arquivoTamanho: number | null;
  motivoRecusa: string | null;
  analisadoPor: string | null;
  analisadoEm: string | null;
  enviadoEm: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: ClienteResumo;
}

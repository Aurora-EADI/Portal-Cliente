export enum ProcuracaoStatus {
  PENDENTE_ENVIO = 'PENDENTE_ENVIO',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA',
  /** Estava aprovada e a Aurora cassou depois. Ver o enum no schema. */
  REVOGADA = 'REVOGADA',
}

export const PROCURACAO_STATUS_LABEL: Record<ProcuracaoStatus, string> = {
  [ProcuracaoStatus.PENDENTE_ENVIO]: 'Aguardando envio',
  [ProcuracaoStatus.EM_ANALISE]: 'Em análise',
  [ProcuracaoStatus.APROVADA]: 'Aprovada',
  [ProcuracaoStatus.REPROVADA]: 'Reprovada',
  [ProcuracaoStatus.REVOGADA]: 'Revogada',
};

export interface ClienteResumo {
  id: string;
  nome: string;
  cnpj: string | null;
}

export interface Procuracao {
  id: string;
  status: ProcuracaoStatus;
  /** Data em que deixa de valer. `null` = sem prazo declarado. */
  validade: string | null;
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

/**
 * Um cliente representado e a situação da procuração dele — inclusive quem
 * ainda não tem nenhuma, que é justamente sobre quem se precisa agir.
 */
export interface ClienteRepresentado {
  cliente: ClienteResumo;
  procuracao: Procuracao | null;
  /** Aprovada e dentro do prazo. Vem do servidor, não recalculado na tela. */
  vigente: boolean;
  processos: number;
}

/**
 * Situação exibida na linha. Junta status e vigência num rótulo só, porque
 * "Aprovada" numa procuração vencida seria mentira para quem lê.
 */
export type SituacaoRepresentado =
  | 'SEM_PROCURACAO'
  | 'EM_ANALISE'
  | 'VIGENTE'
  | 'VENCIDA'
  | 'REPROVADA'
  | 'REVOGADA';

export function situacaoDe(item: ClienteRepresentado): SituacaoRepresentado {
  const p = item.procuracao;
  if (!p || p.status === ProcuracaoStatus.PENDENTE_ENVIO) return 'SEM_PROCURACAO';
  if (p.status === ProcuracaoStatus.EM_ANALISE) return 'EM_ANALISE';
  if (p.status === ProcuracaoStatus.REPROVADA) return 'REPROVADA';
  if (p.status === ProcuracaoStatus.REVOGADA) return 'REVOGADA';
  return item.vigente ? 'VIGENTE' : 'VENCIDA';
}

export const SITUACAO_LABEL: Record<SituacaoRepresentado, string> = {
  SEM_PROCURACAO: 'Pendente de envio',
  EM_ANALISE: 'Em análise',
  VIGENTE: 'Aprovada',
  VENCIDA: 'Vencida',
  REPROVADA: 'Reprovada',
  REVOGADA: 'Revogada',
};

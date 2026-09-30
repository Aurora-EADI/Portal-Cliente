import type { ClienteResumo } from './procuracao';

export enum Modalidade {
  MARITIMO = 'MARITIMO',
  AEREO = 'AEREO',
  RODOVIARIO = 'RODOVIARIO',
}

export const MODALIDADE_LABEL: Record<Modalidade, string> = {
  [Modalidade.MARITIMO]: 'Marítimo',
  [Modalidade.AEREO]: 'Aéreo',
  [Modalidade.RODOVIARIO]: 'Rodoviário',
};

export enum ProcessoStatus {
  RASCUNHO = 'RASCUNHO',
  EM_ANALISE = 'EM_ANALISE',
  PENDENTE_CORRECAO = 'PENDENTE_CORRECAO',
  LIBERADO_AGENDAMENTO = 'LIBERADO_AGENDAMENTO',
  /** Descartado pelo despachante. Terminal; o registro fica para auditoria. */
  CANCELADO = 'CANCELADO',
}

export const PROCESSO_STATUS_LABEL: Record<ProcessoStatus, string> = {
  [ProcessoStatus.RASCUNHO]: 'Aguardando documentos',
  [ProcessoStatus.EM_ANALISE]: 'Em análise',
  [ProcessoStatus.PENDENTE_CORRECAO]: 'Pendente de correção',
  [ProcessoStatus.LIBERADO_AGENDAMENTO]: 'Liberado para agendamento',
  [ProcessoStatus.CANCELADO]: 'Cancelado',
};

export enum DocumentoStatus {
  NAO_ENVIADO = 'NAO_ENVIADO',
  EM_ANALISE = 'EM_ANALISE',
  VALIDADO = 'VALIDADO',
  REJEITADO = 'REJEITADO',
}

export const DOCUMENTO_STATUS_LABEL: Record<DocumentoStatus, string> = {
  [DocumentoStatus.NAO_ENVIADO]: 'Não enviado',
  [DocumentoStatus.EM_ANALISE]: 'Em análise',
  [DocumentoStatus.VALIDADO]: 'Validado',
  [DocumentoStatus.REJEITADO]: 'Rejeitado',
};

export type HistoricoAcao =
  | 'ENVIO'
  | 'APROVACAO'
  | 'REJEICAO'
  | 'SUBSTITUICAO';

export const HISTORICO_ACAO_LABEL: Record<HistoricoAcao, string> = {
  ENVIO: 'Enviado',
  APROVACAO: 'Aprovado',
  REJEICAO: 'Rejeitado',
  SUBSTITUICAO: 'Substituído',
};

export interface HistoricoEntrada {
  id: string;
  acao: HistoricoAcao;
  autorNome: string;
  motivo: string | null;
  arquivoNome: string | null;
  criadoEm: string;
}

export interface TipoDocumentoResumo {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  step: number;
  ordem: number;
  modalidade: Modalidade;
}

export interface AverbacaoDocumento {
  id: string;
  status: DocumentoStatus;
  arquivoNome: string | null;
  arquivoTamanho: number | null;
  motivoRejeicao: string | null;
  createdAt: string;
  updatedAt: string;
  tipoDocumento: TipoDocumentoResumo;
  historico?: HistoricoEntrada[];
}

export interface AverbacaoProcessoResumo {
  id: string;
  protocolo: string;
  modalidade: Modalidade;
  diDuimp: string;
  /** Nulo desde que a carga deixou de ser identificada por container na abertura. */
  containerConhecimento: string | null;
  /** Vazio desde a mesma mudança; mantido para telas e busca antigas. */
  containers: string[];
  /** Porto, aeroporto ou fronteira de origem. Informativo. */
  localOrigem: string | null;
  /** Recinto alfandegado de destino. Informativo. */
  recintoDestino: string | null;
  /** DTA, Anvisa, MAPA, Exército ou sobredimensão. Não muda o que é exigido. */
  cargaEspecial: boolean;
  status: ProcessoStatus;
  nLote: string | null;
  /**
   * Devolução pela equipe Aurora para corrigir os dados (ex.: documento de
   * saída que não existe no SIAUM). Não nulo = devolução pendente.
   */
  devolvidoEm: string | null;
  devolvidoPor: string | null;
  motivoDevolucao: string | null;
  /** Quando o despachante atendeu a devolução, e a DI que havia antes. */
  corrigidoEm: string | null;
  corrigidoPor: string | null;
  diDuimpAnterior: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: ClienteResumo;
  /** Só na listagem, para o resumo de progresso. */
  documentos?: { status: DocumentoStatus; tipoDocumento: { obrigatorio: boolean } }[];
}

export interface AverbacaoProcessoDetalhe extends AverbacaoProcessoResumo {
  despachante?: { id: string; nome: string; codDespachante: string };
  documentos: AverbacaoDocumento[];
}

export interface CriarAverbacaoDto {
  modalidade: Modalidade;
  diDuimp: string;
  clienteId: string;
  localOrigem?: string;
  recintoDestino?: string;
  cargaEspecial?: boolean;
}

/** Correção do processo: só o que muda. Modalidade e cliente não se editam. */
export interface EditarAverbacaoDto {
  diDuimp?: string;
  localOrigem?: string;
  recintoDestino?: string;
  cargaEspecial?: boolean;
}

/**
 * Mesma janela do backend (`editar`/`cancelar`): fecha no vínculo com o SIAUM,
 * na liberação e no cancelamento.
 */
export function processoEditavel(p: {
  status: ProcessoStatus;
  nLote: string | null;
  devolvidoEm: string | null;
  corrigidoEm: string | null;
}): boolean {
  return (
    !p.nLote &&
    p.status !== ProcessoStatus.LIBERADO_AGENDAMENTO &&
    p.status !== ProcessoStatus.CANCELADO &&
    // Correção já enviada: fica com a Aurora. Só volta a editar se ela
    // devolver de novo (a nova devolução zera `corrigidoEm`).
    !(p.corrigidoEm && !p.devolvidoEm)
  );
}

/** Quantos obrigatórios já estão validados — alimenta a barra de progresso. */
export function progressoObrigatorios(
  documentos: { status: DocumentoStatus; tipoDocumento: { obrigatorio: boolean } }[] = [],
): { validados: number; total: number } {
  const obrigatorios = documentos.filter((d) => d.tipoDocumento.obrigatorio);
  return {
    validados: obrigatorios.filter((d) => d.status === DocumentoStatus.VALIDADO)
      .length,
    total: obrigatorios.length,
  };
}

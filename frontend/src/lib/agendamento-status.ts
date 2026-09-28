import type { AgendamentoStatus } from '@/types/agendamento';

/**
 * Como o status do agendamento se chama e se veste para o usuário externo.
 * Espelha `agendamento-status.catalog.ts` do backend, que é a autoridade — aqui
 * é só apresentação.
 */

export const ALL_STATUSES: readonly AgendamentoStatus[] = [
  'ATIVO',
  'AG_CHEGADA',
  'CHEGOU',
  'ON_TIME',
  'ATRASADO',
  'CONCLUIDO',
  'CANCELADO',
  'NO_SHOW',
];

/**
 * O que o painel lista. `CONCLUIDO` entra de propósito: sem ele, a linha sairia
 * da tela no exato momento em que o stream avisa que o caminhão saiu.
 */
export const STATUS_EM_ANDAMENTO: readonly AgendamentoStatus[] = [
  'ATIVO',
  'AG_CHEGADA',
  'CHEGOU',
  'ON_TIME',
  'ATRASADO',
  'CONCLUIDO',
];

export const STATUS_ARQUIVADOS: readonly AgendamentoStatus[] = ['CANCELADO', 'NO_SHOW'];

interface StatusVisual {
  label: string;
  className: string;
}

const STATUS_MAP: Record<AgendamentoStatus, StatusVisual> = {
  ATIVO:      { label: 'Aguardando',     className: 'bg-blue-50 text-blue-700 border-blue-200' },
  CHEGOU:     { label: 'Em Andamento',   className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  CONCLUIDO:  { label: 'Concluído',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELADO:  { label: 'Cancelado',      className: 'bg-zinc-100 text-zinc-400 border-zinc-200' },
  NO_SHOW:    { label: 'Não Compareceu', className: 'bg-red-50 text-red-700 border-red-200' },
  // Pontualidade, não etapa. Ninguém escolhe estes; ficam por causa das linhas
  // antigas, que precisam continuar aparecendo com um nome legível.
  AG_CHEGADA: { label: 'Ag. Chegada',    className: 'bg-orange-50 text-orange-700 border-orange-200' },
  ON_TIME:    { label: 'On-time',        className: 'bg-teal-50 text-teal-700 border-teal-200' },
  ATRASADO:   { label: 'Atrasado',       className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const FALLBACK: StatusVisual = {
  label: 'Desconhecido',
  className: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

export function getStatusVisual(status: string): StatusVisual {
  return STATUS_MAP[status as AgendamentoStatus] ?? { ...FALLBACK, label: status || FALLBACK.label };
}

export function getStatusLabel(status: string): string {
  return getStatusVisual(status).label;
}

export function statusEmAndamento(status: string): boolean {
  return (STATUS_EM_ANDAMENTO as readonly string[]).includes(status);
}

import { AgendamentoStatus } from '@prisma/client';

/**
 * Catálogo único do ciclo de vida do agendamento. O enum do Prisma é a lista de
 * valores possíveis; aqui mora o significado de cada um — quem aparece no
 * seletor, quem é terminal, e de onde para onde se pode ir.
 *
 * Esta é a autoridade: o Aurora tem um espelho para habilitar opções na tela,
 * mas a decisão que vale é a que roda dentro da transação, em
 * `AgendamentoStatusService.changeStatusInTransaction`.
 */

/** Todos os valores, na ordem em que fazem sentido para o olho. */
export const ALL_STATUSES: readonly AgendamentoStatus[] = [
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.AG_CHEGADA,
  AgendamentoStatus.CHEGOU,
  AgendamentoStatus.ON_TIME,
  AgendamentoStatus.ATRASADO,
  AgendamentoStatus.CONCLUIDO,
  AgendamentoStatus.CANCELADO,
  AgendamentoStatus.NO_SHOW,
];

/**
 * O que o operador do Aurora pode escolher. `AG_CHEGADA`, `ON_TIME` e
 * `ATRASADO` ficam fora de propósito: descrevem pontualidade, não etapa, e
 * sobraram de antes. Continuam válidos no banco e continuam sendo renderizados.
 */
export const STATUS_SELECIONAVEIS: readonly AgendamentoStatus[] = [
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.CHEGOU,
  AgendamentoStatus.CONCLUIDO,
  AgendamentoStatus.CANCELADO,
  AgendamentoStatus.NO_SHOW,
];

/**
 * O que o painel do Portal do Cliente lista. `CONCLUIDO` entra de propósito:
 * é a confirmação de que o caminhão saiu, e sem ela a linha desapareceria da
 * tela justamente no momento em que o SSE avisa que mudou.
 */
export const STATUS_EM_ANDAMENTO: readonly AgendamentoStatus[] = [
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.AG_CHEGADA,
  AgendamentoStatus.CHEGOU,
  AgendamentoStatus.ON_TIME,
  AgendamentoStatus.ATRASADO,
  AgendamentoStatus.CONCLUIDO,
];

/** O que sai do painel e vai para o histórico. */
export const STATUS_ARQUIVADOS: readonly AgendamentoStatus[] = [
  AgendamentoStatus.CANCELADO,
  AgendamentoStatus.NO_SHOW,
];

/**
 * De onde para onde. Os três status de pontualidade funcionam como ponte: uma
 * linha antiga parada em `ON_TIME` precisa poder seguir para o fim da vida.
 */
export const TRANSICOES: Readonly<Record<AgendamentoStatus, readonly AgendamentoStatus[]>> = {
  // `CONCLUIDO` direto de `ATIVO` é atalho de propósito: o caminho normal passa
  // pela chegada, mas acontece de ninguém marcar e o caminhão já ter ido embora.
  // Sem o atalho, o operador teria de registrar uma chegada que não observou só
  // para conseguir fechar o agendamento — e aí o histórico passa a mentir.
  [AgendamentoStatus.ATIVO]: [
    AgendamentoStatus.CHEGOU,
    AgendamentoStatus.CONCLUIDO,
    AgendamentoStatus.CANCELADO,
    AgendamentoStatus.NO_SHOW,
  ],
  [AgendamentoStatus.CHEGOU]: [
    AgendamentoStatus.CONCLUIDO,
    AgendamentoStatus.CANCELADO,
  ],
  [AgendamentoStatus.AG_CHEGADA]: [
    AgendamentoStatus.CHEGOU,
    AgendamentoStatus.CONCLUIDO,
    AgendamentoStatus.CANCELADO,
    AgendamentoStatus.NO_SHOW,
  ],
  [AgendamentoStatus.ON_TIME]: [
    AgendamentoStatus.CHEGOU,
    AgendamentoStatus.CONCLUIDO,
    AgendamentoStatus.CANCELADO,
    AgendamentoStatus.NO_SHOW,
  ],
  [AgendamentoStatus.ATRASADO]: [
    AgendamentoStatus.CHEGOU,
    AgendamentoStatus.CONCLUIDO,
    AgendamentoStatus.CANCELADO,
    AgendamentoStatus.NO_SHOW,
  ],
  [AgendamentoStatus.CONCLUIDO]: [],
  [AgendamentoStatus.CANCELADO]: [],
  [AgendamentoStatus.NO_SHOW]: [],
};

/** Destinos legais a partir de `atual`. Vazio = fim da linha. */
export function transicoesPermitidas(atual: AgendamentoStatus): readonly AgendamentoStatus[] {
  return TRANSICOES[atual] ?? [];
}

export function transicaoPermitida(de: AgendamentoStatus, para: AgendamentoStatus): boolean {
  return transicoesPermitidas(de).includes(para);
}

export function statusSelecionavel(status: string): status is AgendamentoStatus {
  return (STATUS_SELECIONAVEIS as readonly string[]).includes(status);
}

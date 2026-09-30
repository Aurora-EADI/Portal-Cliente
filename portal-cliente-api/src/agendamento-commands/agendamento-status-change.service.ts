import { Injectable, NotFoundException } from '@nestjs/common';
import { AgendamentoStatus, Prisma, UserRole } from '@prisma/client';
import {
  AgendamentoStatusService,
  ExpectedAggregateVersionMismatchError,
  TransicaoInvalidaError,
} from '../agendamento/agendamento-status.service';
import { AgendamentoCommandCompletedService } from './agendamento-command-completed.service';
import {
  AGENDAMENTO_COMMAND_REASON_CODES,
  AgendamentoCommandReasonCode,
  AgendamentoCommandRejectionService,
} from './agendamento-command-rejection.service';

export type AgendamentoStatusChangeIntent = {
  commandId: string;
  commandType: 'agendamento.status.change.requested';
  correlationId: string;
  agendamentoId: string;
  nextStatus: AgendamentoStatus;
  expectedAggregateVersion: number;
  actor: { id: string; role: UserRole | string };
};

export type AgendamentoStatusChangeIntentResult =
  | { kind: 'APPLIED'; aggregateVersion: number }
  | { kind: 'ALREADY_SATISFIED'; aggregateVersion: number }
  | {
      kind: 'REJECTED';
      reasonCode: AgendamentoCommandReasonCode;
      currentAggregateVersion?: number;
      currentStatus?: AgendamentoStatus;
    };

/**
 * Versão genérica do comando de cancelamento: a transição de destino vem no
 * payload (`nextStatus`) em vez de ser fixa em CANCELADO. Reusa exatamente a
 * mesma máquina de estados/optimistic-lock de `changeStatusInTransaction`, que
 * é a autoridade e publica o `agendamento.status-changed` de volta.
 */
@Injectable()
export class AgendamentoStatusChangeService {
  constructor(
    private readonly statusWriter: AgendamentoStatusService,
    private readonly completed: AgendamentoCommandCompletedService,
    private readonly rejection: AgendamentoCommandRejectionService,
  ) {}

  async execute(
    tx: Prisma.TransactionClient,
    command: AgendamentoStatusChangeIntent,
  ): Promise<AgendamentoStatusChangeIntentResult> {
    if (command.actor.role !== UserRole.ADMIN && command.actor.role !== UserRole.EMPLOYEE) {
      return this.reject(tx, command, { reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.ACTOR_NOT_ALLOWED });
    }

    try {
      const result = await this.statusWriter.changeStatusInTransaction(tx, {
        agendamentoId: command.agendamentoId,
        nextStatus: command.nextStatus,
        operadorId: command.actor.id,
        correlationId: command.correlationId,
        causationId: command.commandId,
        expectedAggregateVersion: command.expectedAggregateVersion,
      });

      if (!result.changed) {
        await this.completed.create(tx, {
          commandId: command.commandId,
          commandType: command.commandType,
          agendamentoId: command.agendamentoId,
          correlationId: command.correlationId,
          currentAggregateVersion: result.aggregateVersion,
          currentStatus: command.nextStatus,
        });
        return { kind: 'ALREADY_SATISFIED', aggregateVersion: result.aggregateVersion };
      }

      return { kind: 'APPLIED', aggregateVersion: result.aggregateVersion };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.reject(tx, command, { reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.NOT_FOUND });
      }
      if (error instanceof ExpectedAggregateVersionMismatchError) {
        return this.reject(tx, command, {
          reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.VERSION_MISMATCH,
          currentAggregateVersion: error.currentAggregateVersion,
          currentStatus: error.currentStatus,
        });
      }
      if (error instanceof TransicaoInvalidaError) {
        return this.reject(tx, command, {
          reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.TRANSICAO_INVALIDA,
          currentStatus: error.de,
        });
      }
      throw error;
    }
  }

  private async reject(
    tx: Prisma.TransactionClient,
    command: AgendamentoStatusChangeIntent,
    detail: {
      reasonCode: AgendamentoCommandReasonCode;
      currentAggregateVersion?: number;
      currentStatus?: AgendamentoStatus;
    },
  ): Promise<AgendamentoStatusChangeIntentResult> {
    await this.rejection.create(tx, {
      commandId: command.commandId,
      commandType: command.commandType,
      agendamentoId: command.agendamentoId,
      correlationId: command.correlationId,
      reasonCode: detail.reasonCode,
      currentAggregateVersion: detail.currentAggregateVersion,
      currentStatus: detail.currentStatus,
    });
    return { kind: 'REJECTED', ...detail };
  }
}

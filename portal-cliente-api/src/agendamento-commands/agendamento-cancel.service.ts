import { Injectable, NotFoundException } from '@nestjs/common';
import { AgendamentoStatus, Prisma, UserRole } from '@prisma/client';
import {
  AgendamentoStatusService,
  ExpectedAggregateVersionMismatchError,
} from '../agendamento/agendamento-status.service';
import { AgendamentoCommandCompletedService } from './agendamento-command-completed.service';
import {
  AGENDAMENTO_COMMAND_REASON_CODES,
  AgendamentoCommandReasonCode,
} from './agendamento-command-rejection.service';

export type AgendamentoCancelIntent = {
  commandId: string;
  commandType: 'agendamento.cancel.requested';
  correlationId: string;
  agendamentoId: string;
  expectedAggregateVersion: number;
  actor: { id: string; role: UserRole | string };
};

export type AgendamentoCancelIntentResult =
  | { kind: 'APPLIED'; aggregateVersion: number }
  | { kind: 'ALREADY_SATISFIED'; aggregateVersion: number }
  | {
      kind: 'REJECTED';
      reasonCode: AgendamentoCommandReasonCode;
      currentAggregateVersion?: number;
      currentStatus?: AgendamentoStatus;
    };

@Injectable()
export class AgendamentoCancelService {
  constructor(
    private readonly statusWriter: AgendamentoStatusService,
    private readonly completed: AgendamentoCommandCompletedService,
  ) {}

  async execute(
    tx: Prisma.TransactionClient,
    command: AgendamentoCancelIntent,
  ): Promise<AgendamentoCancelIntentResult> {
    if (command.actor.role !== UserRole.ADMIN && command.actor.role !== UserRole.EMPLOYEE) {
      return { kind: 'REJECTED', reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.ACTOR_NOT_ALLOWED };
    }

    try {
      const result = await this.statusWriter.changeStatusInTransaction(tx, {
        agendamentoId: command.agendamentoId,
        nextStatus: AgendamentoStatus.CANCELADO,
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
          currentStatus: AgendamentoStatus.CANCELADO,
        });
        return { kind: 'ALREADY_SATISFIED', aggregateVersion: result.aggregateVersion };
      }

      return { kind: 'APPLIED', aggregateVersion: result.aggregateVersion };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { kind: 'REJECTED', reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.NOT_FOUND };
      }
      if (error instanceof ExpectedAggregateVersionMismatchError) {
        return {
          kind: 'REJECTED',
          reasonCode: AGENDAMENTO_COMMAND_REASON_CODES.VERSION_MISMATCH,
          currentAggregateVersion: error.currentAggregateVersion,
          currentStatus: error.currentStatus,
        };
      }
      throw error;
    }
  }
}

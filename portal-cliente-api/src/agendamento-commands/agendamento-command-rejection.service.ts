import { Injectable } from '@nestjs/common';
import { AgendamentoStatus, Prisma } from '@prisma/client';
import { OutboxService } from '../rabbitmq/publishers/outbox.service';

export const AGENDAMENTO_COMMAND_REASON_CODES = {
  NOT_FOUND: 'AGENDAMENTO_NOT_FOUND',
  ACTOR_NOT_ALLOWED: 'ACTOR_NOT_ALLOWED',
  VERSION_MISMATCH: 'EXPECTED_AGGREGATE_VERSION_MISMATCH',
} as const;

export type AgendamentoCommandReasonCode =
  (typeof AGENDAMENTO_COMMAND_REASON_CODES)[keyof typeof AGENDAMENTO_COMMAND_REASON_CODES];

@Injectable()
export class AgendamentoCommandRejectionService {
  constructor(private readonly outbox: OutboxService) {}

  create(
    tx: Prisma.TransactionClient,
    input: {
      commandId: string;
      commandType: string;
      agendamentoId: string;
      correlationId: string;
      reasonCode: AgendamentoCommandReasonCode;
      currentAggregateVersion?: number;
      currentStatus?: AgendamentoStatus;
    },
  ): Promise<string> {
    return this.outbox.createAgendamentoCommandRejected(tx, input);
  }
}

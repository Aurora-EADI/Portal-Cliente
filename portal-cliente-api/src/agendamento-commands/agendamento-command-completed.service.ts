import { Injectable } from '@nestjs/common';
import { AgendamentoStatus, Prisma } from '@prisma/client';
import { OutboxService } from '../rabbitmq/publishers/outbox.service';

@Injectable()
export class AgendamentoCommandCompletedService {
  constructor(private readonly outbox: OutboxService) {}

  create(
    tx: Prisma.TransactionClient,
    input: {
      commandId: string;
      commandType: string;
      agendamentoId: string;
      correlationId: string;
      currentAggregateVersion: number;
      currentStatus: AgendamentoStatus;
    },
  ): Promise<string> {
    return this.outbox.createAgendamentoCommandCompleted(tx, input);
  }
}

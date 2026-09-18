import { Injectable } from '@nestjs/common';
import { Agendamento, AgendamentoStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { EVENT_TYPES } from '../contracts/event-envelope';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async createAgendamentoStatusChanged(
    tx: Prisma.TransactionClient,
    change: {
      agendamento: Pick<Agendamento, 'id' | 'status'>;
      previousStatus: AgendamentoStatus;
      changedAt: Date;
      aggregateVersion: number;
      correlationId: string | null;
      causationId?: string;
    },
  ): Promise<void> {
    const occurredAt = change.changedAt.toISOString();
    const eventId = randomUUID();
    await tx.outboxEvent.create({
      data: {
        eventId,
        eventType: EVENT_TYPES.AGENDAMENTO_STATUS_CHANGED,
        aggregateType: 'Agendamento',
        aggregateId: change.agendamento.id,
        payload: {
          eventId,
          eventType: EVENT_TYPES.AGENDAMENTO_STATUS_CHANGED,
          version: 2,
          occurredAt,
          source: 'portal-cliente',
          correlationId: change.correlationId,
          ...(change.causationId ? { causationId: change.causationId } : {}),
          payload: {
            agendamentoId: change.agendamento.id,
            status: change.agendamento.status,
            previousStatus: change.previousStatus,
            changedAt: occurredAt,
            aggregateVersion: change.aggregateVersion,
          },
        },
      },
    });
  }
}

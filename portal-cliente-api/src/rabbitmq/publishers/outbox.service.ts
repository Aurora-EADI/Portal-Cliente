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
    agendamento: Pick<Agendamento, 'id' | 'diId' | 'status'>,
    previousStatus: AgendamentoStatus,
    operadorId: string | null,
    correlationId: string | null = null,
  ): Promise<void> {
    const occurredAt = new Date().toISOString();
    const eventId = randomUUID();
    await tx.outboxEvent.create({
      data: {
        eventId,
        eventType: EVENT_TYPES.AGENDAMENTO_STATUS_CHANGED,
        aggregateType: 'Agendamento',
        aggregateId: agendamento.id,
        payload: {
          eventId,
          eventType: EVENT_TYPES.AGENDAMENTO_STATUS_CHANGED,
          version: 1,
          occurredAt,
          source: 'portal-cliente',
          correlationId,
          payload: {
            agendamentoId: agendamento.id,
            diId: agendamento.diId,
            status: agendamento.status,
            dtAlteracao: occurredAt,
            operadorId,
            previousStatus,
          },
        },
      },
    });
  }
}

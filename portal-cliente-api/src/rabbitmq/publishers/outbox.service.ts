import { Injectable } from '@nestjs/common';
import {
  Agendamento,
  AgendamentoStatus,
  AverbacaoProcessoStatus,
  Prisma,
} from '@prisma/client';
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
  ): Promise<string> {
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
    return eventId;
  }

  async createAgendamentoCommandCompleted(
    tx: Prisma.TransactionClient,
    completed: {
      commandId: string;
      commandType: string;
      agendamentoId: string;
      correlationId: string;
      currentAggregateVersion: number;
      currentStatus: AgendamentoStatus;
      occurredAt?: Date;
    },
  ): Promise<string> {
    const occurredAt = (completed.occurredAt ?? new Date()).toISOString();
    const eventId = randomUUID();
    await tx.outboxEvent.create({
      data: {
        eventId,
        eventType: EVENT_TYPES.AGENDAMENTO_COMMAND_COMPLETED,
        aggregateType: 'Agendamento',
        aggregateId: completed.agendamentoId,
        payload: {
          eventId,
          eventType: EVENT_TYPES.AGENDAMENTO_COMMAND_COMPLETED,
          version: 1,
          occurredAt,
          source: 'portal-cliente',
          correlationId: completed.correlationId,
          causationId: completed.commandId,
          payload: {
            commandId: completed.commandId,
            commandType: completed.commandType,
            agendamentoId: completed.agendamentoId,
            outcome: 'ALREADY_SATISFIED',
            currentAggregateVersion: completed.currentAggregateVersion,
            currentStatus: completed.currentStatus,
          },
        },
      },
    });
    return eventId;
  }

  async createAgendamentoCommandRejected(
    tx: Prisma.TransactionClient,
    rejection: {
      commandId: string;
      commandType: string;
      agendamentoId: string;
      correlationId: string;
      reasonCode: string;
      currentAggregateVersion?: number;
      currentStatus?: AgendamentoStatus;
      occurredAt?: Date;
    },
  ): Promise<string> {
    const occurredAt = (rejection.occurredAt ?? new Date()).toISOString();
    const eventId = randomUUID();
    await tx.outboxEvent.create({
      data: {
        eventId,
        eventType: EVENT_TYPES.AGENDAMENTO_COMMAND_REJECTED,
        aggregateType: 'Agendamento',
        aggregateId: rejection.agendamentoId,
        payload: {
          eventId,
          eventType: EVENT_TYPES.AGENDAMENTO_COMMAND_REJECTED,
          version: 1,
          occurredAt,
          source: 'portal-cliente',
          correlationId: rejection.correlationId,
          causationId: rejection.commandId,
          payload: {
            commandId: rejection.commandId,
            commandType: rejection.commandType,
            agendamentoId: rejection.agendamentoId,
            reasonCode: rejection.reasonCode,
            ...(rejection.currentAggregateVersion === undefined
              ? {}
              : { currentAggregateVersion: rejection.currentAggregateVersion }),
            ...(rejection.currentStatus === undefined ? {} : { currentStatus: rejection.currentStatus }),
          },
        },
      },
    });
    return eventId;
  }

  /**
   * Registra, na mesma transação que gravou o documento, que o processo de
   * averbação mudou por ação do despachante. O Portal Aurora consome este
   * evento para atualizar a fila de validação em tempo real — o payload é só o
   * necessário para a tela de lá refazer o próprio fetch (já escopado por
   * permissão), sem trafegar documento nem dado do processo.
   */
  async createAverbacaoProcessoAtualizado(
    tx: Prisma.TransactionClient,
    processo: {
      id: string;
      clienteId: string;
      despachanteId: string | null;
      status: AverbacaoProcessoStatus;
    },
    correlationId: string | null = null,
  ): Promise<void> {
    const occurredAt = new Date().toISOString();
    const eventId = randomUUID();
    await tx.outboxEvent.create({
      data: {
        eventId,
        eventType: EVENT_TYPES.AVERBACAO_PROCESSO_ATUALIZADO,
        aggregateType: 'AverbacaoProcesso',
        aggregateId: processo.id,
        payload: {
          eventId,
          eventType: EVENT_TYPES.AVERBACAO_PROCESSO_ATUALIZADO,
          version: 1,
          occurredAt,
          source: 'portal-cliente',
          correlationId,
          payload: {
            processoId: processo.id,
            clienteId: processo.clienteId,
            despachanteId: processo.despachanteId,
            status: processo.status,
          },
        },
      },
    });
  }
}

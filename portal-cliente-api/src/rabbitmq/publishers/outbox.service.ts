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

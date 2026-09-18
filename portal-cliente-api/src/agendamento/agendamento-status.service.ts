import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AgendamentoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../rabbitmq/publishers/outbox.service';

export type AgendamentoStatusChangeInput = {
  agendamentoId: string;
  nextStatus: AgendamentoStatus;
  operadorId: string | null;
  correlationId: string | null;
  causationId?: string;
};

export type AgendamentoStatusChange = {
  agendamento: unknown;
  previousStatus: AgendamentoStatus;
  changedAt: Date | null;
  aggregateVersion: number;
  changed: boolean;
};

export class AggregateVersionRetryError extends Error {
  readonly code = 'AGGREGATE_VERSION_RETRY';
}

@Injectable()
export class AgendamentoStatusService {
  private readonly maxRetries = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async changeStatus(input: AgendamentoStatusChangeInput): Promise<AgendamentoStatusChange> {
    if (!Object.values(AgendamentoStatus).includes(input.nextStatus)) {
      throw new BadRequestException('Status inválido');
    }

    for (let attempt = 0; attempt < this.maxRetries; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => this.changeInTransaction(tx, input));
      } catch (error) {
        if (error instanceof AggregateVersionRetryError) continue;
        throw error;
      }
    }

    throw new ConflictException('Agendamento foi alterado concorrentemente; tente novamente');
  }

  private async changeInTransaction(
    tx: Prisma.TransactionClient,
    input: AgendamentoStatusChangeInput,
  ): Promise<AgendamentoStatusChange> {
    const existing = await tx.agendamento.findUnique({ where: { id: input.agendamentoId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    if (existing.status === input.nextStatus) {
      return {
        agendamento: existing,
        previousStatus: existing.status,
        changedAt: null,
        aggregateVersion: existing.aggregateVersion,
        changed: false,
      };
    }

    const changedAt = new Date();
    const result = await tx.agendamento.updateMany({
      where: {
        id: input.agendamentoId,
        aggregateVersion: existing.aggregateVersion,
      },
      data: {
        status: input.nextStatus,
        aggregateVersion: { increment: 1 },
      },
    });

    if (result.count !== 1) throw new AggregateVersionRetryError();

    const aggregateVersion = existing.aggregateVersion + 1;
    const agendamento = await tx.agendamento.findUnique({
      where: { id: input.agendamentoId },
      include: {
        motorista: true,
        veiculo: true,
        cliente: { select: { id: true, nome: true } },
      },
    });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado após atualização');

    await tx.agendamentoStatusHistorico.create({
      data: {
        agendamentoId: input.agendamentoId,
        status: input.nextStatus,
        previousStatus: existing.status,
        operadorId: input.operadorId,
        dtAlteracao: changedAt,
      },
    });

    await this.outbox.createAgendamentoStatusChanged(tx, {
      agendamento,
      previousStatus: existing.status,
      changedAt,
      aggregateVersion,
      correlationId: input.correlationId,
      causationId: input.causationId,
    });

    return {
      agendamento,
      previousStatus: existing.status,
      changedAt,
      aggregateVersion,
      changed: true,
    };
  }
}

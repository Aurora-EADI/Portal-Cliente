import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AgendamentoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../rabbitmq/publishers/outbox.service';
import { transicaoPermitida, transicoesPermitidas } from './agendamento-status.catalog';

export type AgendamentoStatusChangeInput = {
  agendamentoId: string;
  nextStatus: AgendamentoStatus;
  operadorId: string | null;
  correlationId: string | null;
  causationId?: string;
  expectedAggregateVersion?: number;
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

/**
 * Transicao fora da maquina de estados. Existe como erro de dominio, e nao como
 * validacao de rota, porque tres caminhos escrevem neste campo: a rota de
 * servico do Aurora, o cancelar do proprio cliente e o consumer do comando.
 * Guarda em um deles deixaria buraco nos outros dois.
 */
export class TransicaoInvalidaError extends Error {
  readonly code = 'TRANSICAO_INVALIDA';

  constructor(
    readonly de: AgendamentoStatus,
    readonly para: AgendamentoStatus,
    readonly permitidas: readonly AgendamentoStatus[],
  ) {
    super(
      permitidas.length
        ? `Nao e possivel mudar de ${de} para ${para}; a partir de ${de} so cabe: ${permitidas.join(', ')}`
        : `${de} e um status final; o agendamento nao muda mais`,
    );
  }
}

export class ExpectedAggregateVersionMismatchError extends Error {
  readonly code = 'EXPECTED_AGGREGATE_VERSION_MISMATCH';

  constructor(
    readonly currentAggregateVersion: number,
    readonly currentStatus: AgendamentoStatus,
  ) {
    super('A versão esperada do agendamento não corresponde à versão atual');
  }
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
        return await this.prisma.$transaction(async (tx) => this.changeStatusInTransaction(tx, input));
      } catch (error) {
        if (error instanceof AggregateVersionRetryError) continue;
        throw error;
      }
    }

    throw new ConflictException('Agendamento foi alterado concorrentemente; tente novamente');
  }

  async changeStatusInTransaction(
    tx: Prisma.TransactionClient,
    input: AgendamentoStatusChangeInput,
  ): Promise<AgendamentoStatusChange> {
    if (!Object.values(AgendamentoStatus).includes(input.nextStatus)) {
      throw new BadRequestException('Status inválido');
    }

    const existing = await tx.agendamento.findUnique({ where: { id: input.agendamentoId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    if (
      input.expectedAggregateVersion !== undefined
      && existing.aggregateVersion !== input.expectedAggregateVersion
    ) {
      throw new ExpectedAggregateVersionMismatchError(existing.aggregateVersion, existing.status);
    }

    // Mesmo status nao e transicao: cai no atalho abaixo e volta como sucesso
    // silencioso, sem historico e sem evento.
    if (
      existing.status !== input.nextStatus
      && !transicaoPermitida(existing.status, input.nextStatus)
    ) {
      throw new TransicaoInvalidaError(
        existing.status,
        input.nextStatus,
        transicoesPermitidas(existing.status),
      );
    }

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
        aggregateVersion: input.expectedAggregateVersion ?? existing.aggregateVersion,
      },
      data: {
        status: input.nextStatus,
        aggregateVersion: { increment: 1 },
      },
    });

    if (result.count !== 1) {
      if (input.expectedAggregateVersion !== undefined) {
        throw new ExpectedAggregateVersionMismatchError(existing.aggregateVersion, existing.status);
      }
      throw new AggregateVersionRetryError();
    }

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

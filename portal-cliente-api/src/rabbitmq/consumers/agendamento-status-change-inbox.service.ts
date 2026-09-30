import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AgendamentoStatusChangeRequestedCommand } from '../contracts/agendamento-command.contract';
import { AgendamentoStatusChangeService } from '../../agendamento-commands/agendamento-status-change.service';

@Injectable()
export class AgendamentoStatusChangeInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusChange: AgendamentoStatusChangeService,
  ) {}

  async process(command: AgendamentoStatusChangeRequestedCommand): Promise<{ duplicate: boolean; kind?: string }> {
    return this.prisma.$transaction(async (tx) => {
      try {
        await tx.processedEvent.create({
          data: { eventId: command.commandId, eventType: command.eventType },
        });
      } catch (error) {
        if (this.isUniqueEvent(error)) return { duplicate: true };
        throw error;
      }

      const result = await this.statusChange.execute(tx, {
        commandId: command.commandId,
        commandType: command.eventType,
        correlationId: command.correlationId,
        agendamentoId: command.payload.agendamentoId,
        nextStatus: command.payload.nextStatus,
        expectedAggregateVersion: command.payload.expectedAggregateVersion,
        actor: command.payload.actor,
      });
      return { duplicate: false, kind: result.kind };
    });
  }

  private isUniqueEvent(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      || typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}

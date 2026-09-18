import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AgendamentoCancelIntent,
  AgendamentoCancelIntentResult,
  AgendamentoCancelService,
} from './agendamento-cancel.service';
import { AgendamentoCommandRejectionService } from './agendamento-command-rejection.service';

@Injectable()
export class AgendamentoCommandTransactionService {
  constructor(
    private readonly cancel: AgendamentoCancelService,
    private readonly rejection: AgendamentoCommandRejectionService,
  ) {}

  async execute(
    tx: Prisma.TransactionClient,
    command: AgendamentoCancelIntent,
  ): Promise<AgendamentoCancelIntentResult> {
    const result = await this.cancel.execute(tx, command);
    if (result.kind === 'REJECTED') {
      await this.rejection.create(tx, {
        commandId: command.commandId,
        commandType: command.commandType,
        agendamentoId: command.agendamentoId,
        correlationId: command.correlationId,
        reasonCode: result.reasonCode,
        currentAggregateVersion: result.currentAggregateVersion,
        currentStatus: result.currentStatus,
      });
    }
    return result;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { parseAgendamentoCancelRequested } from '../contracts/agendamento-command.contract';
import { RabbitMqService } from '../rabbitmq.service';
import { AgendamentoCommandInboxService } from './agendamento-command-inbox.service';

@Injectable()
export class AgendamentoCancelConsumer {
  private readonly logger = new Logger(AgendamentoCancelConsumer.name);

  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly inbox: AgendamentoCommandInboxService,
  ) {}

  register(): void {
    if (!this.rabbit.topology.agendamentoCommandConsumerEnabled) return;
    this.rabbit.registerConsumer(this.rabbit.topology.agendamentoCancelQueue, (message) => this.handle(message));
  }

  async handle(message: ConsumeMessage): Promise<void> {
    let commandId = 'unknown';
    let correlationId: string | null = null;
    try {
      const parsed = parseAgendamentoCancelRequested(JSON.parse(message.content.toString('utf8')));
      commandId = parsed.commandId;
      correlationId = parsed.correlationId;
      const result = await this.inbox.process(parsed);
      await this.rabbit.ack(message);
      this.logger.log(`RabbitMQ command consumido commandId=${commandId} correlationId=${correlationId} resultado=${result.duplicate ? 'duplicate' : result.kind ?? 'processed'}`);
    } catch (error) {
      const permanent = this.isPermanent(error);
      const retry = permanent ? this.rabbit.topology.maxRetries : this.retryCount(message) + 1;
      const exchange = permanent || retry >= this.rabbit.topology.maxRetries
        ? this.rabbit.topology.commandDeadLetterExchange
        : this.rabbit.topology.commandRetryExchange;
      try {
        await this.rabbit.publish(exchange, 'agendamento.cancel.requested', JSON.parse(message.content.toString('utf8')), {
          headers: { ...message.properties.headers, 'x-retry-count': retry },
          correlationId: correlationId ?? undefined,
          messageId: commandId === 'unknown' ? undefined : commandId,
        });
        await this.rabbit.ack(message);
        this.logger.error(`RabbitMQ command falhou commandId=${commandId} tentativa=${retry} resultado=${retry >= this.rabbit.topology.maxRetries ? 'dlq' : 'retry'} erro=${this.errorMessage(error)}`);
      } catch (routingError) {
        this.logger.error(`RabbitMQ command não roteado commandId=${commandId} resultado=unacked erro=${this.errorMessage(routingError)}`);
      }
    }
  }

  private isPermanent(error: unknown): boolean {
    return error instanceof SyntaxError
      || error instanceof Error && error.message === 'AGENDAMENTO_COMMAND_INVALID';
  }

  private retryCount(message: ConsumeMessage): number {
    const value = message.properties.headers?.['x-retry-count'];
    const parsed = typeof value === 'number' ? value : Number(value ?? 0);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  }

  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'erro desconhecido'; }
}

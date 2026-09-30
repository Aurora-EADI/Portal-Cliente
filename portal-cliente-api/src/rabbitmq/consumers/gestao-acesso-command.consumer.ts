import { Injectable, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { parseGestaoAcessoCommand } from '../contracts/gestao-acesso-command.contract';
import { RabbitMqService } from '../rabbitmq.service';
import { GestaoAcessoCommandInboxService } from './gestao-acesso-command-inbox.service';

const ROUTING_KEY = 'gestao-acesso.command.requested';

@Injectable()
export class GestaoAcessoCommandConsumer {
  private readonly logger = new Logger(GestaoAcessoCommandConsumer.name);

  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly inbox: GestaoAcessoCommandInboxService,
  ) {}

  register(): void {
    if (!this.rabbit.topology.gestaoAcessoCommandConsumerEnabled) return;
    this.rabbit.registerConsumer(this.rabbit.topology.gestaoAcessoCommandQueue, (message) => this.handle(message));
  }

  async handle(message: ConsumeMessage): Promise<void> {
    let commandId = 'unknown';
    let correlationId: string | null = null;
    try {
      const parsed = parseGestaoAcessoCommand(JSON.parse(message.content.toString('utf8')));
      commandId = parsed.commandId;
      correlationId = parsed.correlationId;
      const result = await this.inbox.process(parsed);
      await this.rabbit.ack(message);
      this.logger.log(`RabbitMQ command consumido commandId=${commandId} correlationId=${correlationId} op=${result.op} resultado=${result.duplicate ? 'duplicate' : 'processed'}`);
    } catch (error) {
      const permanent = this.isPermanent(error);
      const retry = permanent ? this.rabbit.topology.maxRetries : this.retryCount(message) + 1;
      const exchange = permanent || retry >= this.rabbit.topology.maxRetries
        ? this.rabbit.topology.commandDeadLetterExchange
        : this.rabbit.topology.commandRetryExchange;
      try {
        await this.rabbit.publish(exchange, ROUTING_KEY, JSON.parse(message.content.toString('utf8')), {
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
      || error instanceof Error && error.message === 'GESTAO_ACESSO_COMMAND_INVALID';
  }

  private retryCount(message: ConsumeMessage): number {
    const value = message.properties.headers?.['x-retry-count'];
    const parsed = typeof value === 'number' ? value : Number(value ?? 0);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  }

  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'erro desconhecido'; }
}

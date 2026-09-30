import { Injectable, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { ZodError } from 'zod';
import { parseTransportadorasReplicar } from '../contracts/transportadoras-replicar.contract';
import { RabbitMqService } from '../rabbitmq.service';
import { TransportadorasInboxService } from './transportadoras-inbox.service';

const ROUTING_KEY = 'transportadoras.replicar';

@Injectable()
export class TransportadorasConsumer {
  private readonly logger = new Logger(TransportadorasConsumer.name);

  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly inbox: TransportadorasInboxService,
  ) {}

  register(): void {
    this.rabbit.registerConsumer(this.rabbit.topology.transportadorasQueue, (message) => this.handle(message));
  }

  private async handle(message: ConsumeMessage): Promise<void> {
    let eventId = 'unknown';
    let correlationId: string | null = null;
    try {
      const event = parseTransportadorasReplicar(JSON.parse(message.content.toString('utf8')));
      eventId = event.eventId;
      correlationId = event.correlationId;
      const result = await this.inbox.process(event);
      await this.rabbit.ack(message);
      this.logger.log(`RabbitMQ consumido eventId=${eventId} eventType=${ROUTING_KEY} correlationId=${correlationId ?? 'null'} synced=${result.synced} skipped=${result.skipped}`);
    } catch (error) {
      const validationError = error instanceof ZodError;
      const retry = validationError ? this.rabbit.topology.maxRetries : this.retryCount(message) + 1;
      const exchange = validationError || retry >= this.rabbit.topology.maxRetries
        ? this.rabbit.topology.deadLetterExchange
        : this.rabbit.topology.retryExchange;
      try {
        await this.rabbit.publish(exchange, ROUTING_KEY, JSON.parse(message.content.toString('utf8')), {
          headers: { ...message.properties.headers, 'x-retry-count': retry },
          correlationId: correlationId ?? undefined,
          messageId: eventId === 'unknown' ? undefined : eventId,
        });
        await this.rabbit.ack(message);
        this.logger.error(`RabbitMQ falhou eventId=${eventId} eventType=${ROUTING_KEY} correlationId=${correlationId ?? 'null'} tentativa=${retry} resultado=${retry >= this.rabbit.topology.maxRetries ? 'dlq' : 'retry'} erro=${this.errorMessage(error)}`);
      } catch (routingError) {
        this.logger.error(`RabbitMQ roteamento não confirmado eventId=${eventId} tentativa=${retry} resultado=unacked erro=${this.errorMessage(routingError)}`);
      }
    }
  }

  private retryCount(message: ConsumeMessage): number {
    const value = message.properties.headers?.['x-retry-count'];
    const parsed = typeof value === 'number' ? value : Number(value ?? 0);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'erro desconhecido'; }
}

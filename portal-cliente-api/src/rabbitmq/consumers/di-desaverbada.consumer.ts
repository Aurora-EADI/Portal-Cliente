import { Injectable, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { parseDisAverbadaRemoved } from '../contracts/event-envelope';
import { RabbitMqService } from '../rabbitmq.service';
import { DiDesaverbadaInboxService } from './di-desaverbada-inbox.service';
import { ZodError } from 'zod';

@Injectable()
export class DiDesaverbadaConsumer {
  private readonly logger = new Logger(DiDesaverbadaConsumer.name);

  constructor(private readonly rabbit: RabbitMqService, private readonly inbox: DiDesaverbadaInboxService) {}

  register(): void { this.rabbit.registerConsumer(this.rabbit.topology.diDesaverbadaQueue, (message) => this.handle(message)); }

  private async handle(message: ConsumeMessage): Promise<void> {
    let eventId = 'unknown';
    let eventType = 'unknown';
    let correlationId: string | null = null;
    try {
      const parsed = JSON.parse(message.content.toString('utf8'));
      const event = parseDisAverbadaRemoved(parsed);
      eventId = event.eventId;
      eventType = event.eventType;
      correlationId = event.correlationId;
      const result = await this.inbox.process(event);
      await this.rabbit.ack(message);
      this.logger.log(`RabbitMQ consumido eventId=${eventId} eventType=${eventType} correlationId=${correlationId ?? 'null'} resultado=${result.duplicate ? 'duplicate' : 'processed'}`);
    } catch (error) {
      const validationError = error instanceof ZodError;
      const retry = validationError ? this.rabbit.topology.maxRetries : this.retryCount(message) + 1;
      const exchange = validationError || retry >= this.rabbit.topology.maxRetries
        ? this.rabbit.topology.deadLetterExchange
        : this.rabbit.topology.retryExchange;
      try {
        await this.rabbit.publish(exchange, 'dis.averbada.removed', JSON.parse(message.content.toString('utf8')), {
          headers: { ...message.properties.headers, 'x-retry-count': retry },
          correlationId: correlationId ?? undefined,
          messageId: eventId === 'unknown' ? undefined : eventId,
        });
        await this.rabbit.ack(message);
        this.logger.error(`RabbitMQ falhou eventId=${eventId} eventType=${eventType} correlationId=${correlationId ?? 'null'} tentativa=${retry} resultado=${retry >= this.rabbit.topology.maxRetries ? 'dlq' : 'retry'} erro=${this.errorMessage(error)}`);
      } catch (routingError) {
        // Sem confirm do roteamento, não ACK: broker redeliverá após reconexão.
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

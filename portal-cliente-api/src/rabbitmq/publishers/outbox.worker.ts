import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OutboxEvent, OutboxEventStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { RabbitMqService } from '../rabbitmq.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private running = false;
  constructor(private readonly prisma: PrismaService, private readonly rabbit: RabbitMqService) {}

  @Interval(5_000)
  async publishPending(): Promise<void> {
    if (this.running || !this.rabbit.isReady) return;
    this.running = true;
    try {
      const leaseToken = randomUUID();
      const events = await this.claim(leaseToken, 20);
      for (const event of events) await this.publishOne(event, leaseToken);
    } finally { this.running = false; }
  }

  private async claim(leaseToken: string, limit: number): Promise<OutboxEvent[]> {
    const now = new Date();
    const expired = new Date(now.getTime() - 60_000);
    return this.prisma.$queryRaw<OutboxEvent[]>`
      WITH candidates AS (
        SELECT id FROM "outbox_events"
        WHERE (status = 'PENDING'::"OutboxEventStatus" AND next_attempt_at <= ${now})
           OR (status = 'PROCESSING'::"OutboxEventStatus" AND locked_at < ${expired})
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      UPDATE "outbox_events" AS event
      SET status = 'PROCESSING'::"OutboxEventStatus", lease_token = ${leaseToken}, locked_at = ${now}
      FROM candidates WHERE event.id = candidates.id
      RETURNING
        event.id,
        event.event_id AS "eventId",
        event.event_type AS "eventType",
        event.aggregate_type AS "aggregateType",
        event.aggregate_id AS "aggregateId",
        event.payload,
        event.status,
        event.attempts,
        event.created_at AS "createdAt",
        event.published_at AS "publishedAt",
        event.next_attempt_at AS "nextAttemptAt",
        event.last_error AS "lastError",
        event.lease_token AS "leaseToken",
        event.locked_at AS "lockedAt"`;
  }

  private async publishOne(event: OutboxEvent, leaseToken: string): Promise<void> {
    try {
      await this.rabbit.publish(this.rabbit.topology.exchange, event.eventType, event.payload);
      await this.prisma.outboxEvent.updateMany({
        where: { id: event.id, leaseToken, status: OutboxEventStatus.PROCESSING },
        data: { status: OutboxEventStatus.PUBLISHED, publishedAt: new Date(), leaseToken: null, lockedAt: null },
      });
      this.logger.log(`RabbitMQ publicado eventId=${event.eventId} eventType=${event.eventType} tentativa=${event.attempts + 1} resultado=confirmed`);
    } catch (error) {
      const attempts = event.attempts + 1;
      await this.prisma.outboxEvent.updateMany({
        where: { id: event.id, leaseToken, status: OutboxEventStatus.PROCESSING },
        data: { status: OutboxEventStatus.PENDING, attempts, nextAttemptAt: new Date(Date.now() + Math.min(30_000 * attempts, 300_000)), lastError: this.errorMessage(error), leaseToken: null, lockedAt: null },
      });
      this.logger.error(`RabbitMQ publicação falhou eventId=${event.eventId} eventType=${event.eventType} tentativa=${attempts} resultado=pending erro=${this.errorMessage(error)}`);
    }
  }
  private errorMessage(error: unknown): string { return (error instanceof Error ? error.message : 'erro desconhecido').slice(0, 1000); }
}

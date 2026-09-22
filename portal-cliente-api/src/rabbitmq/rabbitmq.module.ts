import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DisModule } from '../dis/dis.module';
import { DiAverbadaConsumer } from './consumers/di-averbada.consumer';
import { DiAverbadaInboxService } from './consumers/di-averbada-inbox.service';
import { DiDesaverbadaConsumer } from './consumers/di-desaverbada.consumer';
import { DiDesaverbadaInboxService } from './consumers/di-desaverbada-inbox.service';
import { OutboxService } from './publishers/outbox.service';
import { OutboxWorker } from './publishers/outbox.worker';
import { RabbitMqLifecycle } from './rabbitmq.lifecycle';
import { RabbitMqService } from './rabbitmq.service';

@Module({
  imports: [PrismaModule, DisModule],
  providers: [RabbitMqService, RabbitMqLifecycle, DiAverbadaInboxService, DiAverbadaConsumer, DiDesaverbadaInboxService, DiDesaverbadaConsumer, OutboxService, OutboxWorker],
  exports: [RabbitMqService, OutboxService],
})
export class RabbitMqModule {}

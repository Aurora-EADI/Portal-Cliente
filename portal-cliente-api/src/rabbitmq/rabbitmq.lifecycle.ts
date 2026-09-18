import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiAverbadaConsumer } from './consumers/di-averbada.consumer';
import { AgendamentoCancelConsumer } from './consumers/agendamento-cancel.consumer';
import { RabbitMqService } from './rabbitmq.service';

@Injectable()
export class RabbitMqLifecycle implements OnApplicationBootstrap {
  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly diAverbadaConsumer: DiAverbadaConsumer,
    private readonly agendamentoCancelConsumer: AgendamentoCancelConsumer,
  ) {}
  onApplicationBootstrap(): void {
    this.diAverbadaConsumer.register();
    this.agendamentoCancelConsumer.register();
    void this.rabbit.start();
  }
}

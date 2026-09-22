import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiAverbadaConsumer } from './consumers/di-averbada.consumer';
import { DiDesaverbadaConsumer } from './consumers/di-desaverbada.consumer';
import { RabbitMqService } from './rabbitmq.service';

@Injectable()
export class RabbitMqLifecycle implements OnApplicationBootstrap {
  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly diAverbadaConsumer: DiAverbadaConsumer,
    private readonly diDesaverbadaConsumer: DiDesaverbadaConsumer,
  ) {}
  onApplicationBootstrap(): void {
    this.diAverbadaConsumer.register();
    this.diDesaverbadaConsumer.register();
    void this.rabbit.start();
  }
}

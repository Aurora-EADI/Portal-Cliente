import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiAverbadaConsumer } from './consumers/di-averbada.consumer';
import { RabbitMqService } from './rabbitmq.service';

@Injectable()
export class RabbitMqLifecycle implements OnApplicationBootstrap {
  constructor(private readonly rabbit: RabbitMqService, private readonly diAverbadaConsumer: DiAverbadaConsumer) {}
  onApplicationBootstrap(): void {
    this.diAverbadaConsumer.register();
    void this.rabbit.start();
  }
}

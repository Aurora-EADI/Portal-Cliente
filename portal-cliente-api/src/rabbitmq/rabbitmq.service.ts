import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { connect, ChannelModel, ConfirmChannel, ConsumeMessage, Options, RecoveringChannelModel } from 'amqplib';
import { rabbitMqConfig, RabbitMqConfig, RABBITMQ_DEFAULTS } from './rabbitmq.config';

type ConsumerRegistration = { queue: string; handler: (message: ConsumeMessage) => Promise<void> };

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private readonly config: RabbitMqConfig = rabbitMqConfig();
  private connection?: RecoveringChannelModel;
  private channel?: ConfirmChannel;
  private stopping = false;
  private readonly registrations: ConsumerRegistration[] = [];
  private readonly consumerTags: string[] = [];

  get isReady(): boolean { return Boolean(this.channel); }
  get topology(): RabbitMqConfig { return this.config; }

  async start(): Promise<void> {
    if (this.stopping || this.connection || !this.config.url) return;
    try {
      // URL is intentionally never logged: it may contain credentials.
      this.connection = await connect(this.config.url, {
        recovery: {
          initialDelay: RABBITMQ_DEFAULTS.reconnectInitialMs,
          maxDelay: RABBITMQ_DEFAULTS.reconnectMaxMs,
          factor: 2,
          setup: (model: ChannelModel) => this.setupChannel(model),
        },
      });
      this.connection.on('disconnect', () => { this.channel = undefined; this.consumerTags.length = 0; });
      this.connection.on('reconnect-scheduled', (info) => this.logger.warn(`RabbitMQ reconectará em ${info.delay}ms`));
      this.connection.on('error', () => undefined);
    } catch (error) {
      this.connection = undefined;
      this.logger.warn(`RabbitMQ indisponível; nova tentativa com backoff: ${this.errorMessage(error)}`);
    }
  }

  registerConsumer(queue: string, handler: (message: ConsumeMessage) => Promise<void>): void {
    this.registrations.push({ queue, handler });
  }

  async publish(exchange: string, routingKey: string, payload: unknown, options: Options.Publish = {}): Promise<void> {
    const channel = this.channel;
    if (!channel) throw new Error('RabbitMQ indisponível');
    const accepted = channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
      ...options,
    });
    if (!accepted) await new Promise<void>((resolve) => channel.once('drain', resolve));
    await channel.waitForConfirms();
  }

  async ack(message: ConsumeMessage): Promise<void> { this.channel?.ack(message); }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    const channel = this.channel;
    this.channel = undefined;
    if (channel) {
      await Promise.all(this.consumerTags.map((tag) => channel.cancel(tag).catch(() => undefined)));
      await channel.close().catch(() => undefined);
    }
    await this.connection?.close().catch(() => undefined);
    this.connection = undefined;
  }

  private async assertTopology(): Promise<void> {
    const channel = this.requireChannel();
    await channel.assertExchange(this.config.exchange, 'topic', { durable: true });
    await channel.assertExchange(this.config.retryExchange, 'topic', { durable: true });
    await channel.assertExchange(this.config.deadLetterExchange, 'topic', { durable: true });
    await channel.assertExchange(this.config.commandExchange, 'topic', { durable: true });
    await channel.assertExchange(this.config.commandRetryExchange, 'topic', { durable: true });
    await channel.assertExchange(this.config.commandDeadLetterExchange, 'topic', { durable: true });
    await channel.assertQueue(this.config.diAverbadaQueue, {
      durable: true,
      deadLetterExchange: this.config.deadLetterExchange,
    });
    await channel.bindQueue(this.config.diAverbadaQueue, this.config.exchange, 'dis.averbada.created');
    await channel.assertQueue(this.config.diAverbadaRetryQueue, {
      durable: true,
      messageTtl: this.config.retryDelayMs,
      deadLetterExchange: this.config.exchange,
      deadLetterRoutingKey: 'dis.averbada.created',
    });
    await channel.bindQueue(this.config.diAverbadaRetryQueue, this.config.retryExchange, 'dis.averbada.created');
    await channel.assertQueue(this.config.diAverbadaDlq, { durable: true });
    await channel.bindQueue(this.config.diAverbadaDlq, this.config.deadLetterExchange, 'dis.averbada.created');

    // Mesma topologia (retry 30s + DLQ) para a desaverbação.
    await channel.assertQueue(this.config.diDesaverbadaQueue, {
      durable: true,
      deadLetterExchange: this.config.deadLetterExchange,
    });
    await channel.bindQueue(this.config.diDesaverbadaQueue, this.config.exchange, 'dis.averbada.removed');
    await channel.assertQueue(this.config.diDesaverbadaRetryQueue, {
      durable: true,
      messageTtl: this.config.retryDelayMs,
      deadLetterExchange: this.config.exchange,
      deadLetterRoutingKey: 'dis.averbada.removed',
    });
    await channel.bindQueue(this.config.diDesaverbadaRetryQueue, this.config.retryExchange, 'dis.averbada.removed');
    await channel.assertQueue(this.config.diDesaverbadaDlq, { durable: true });
    await channel.bindQueue(this.config.diDesaverbadaDlq, this.config.deadLetterExchange, 'dis.averbada.removed');

    await channel.assertQueue(this.config.agendamentoCancelQueue, {
      durable: true,
      deadLetterExchange: this.config.commandDeadLetterExchange,
    });
    await channel.bindQueue(this.config.agendamentoCancelQueue, this.config.commandExchange, 'agendamento.cancel.requested');
    await channel.assertQueue(this.config.agendamentoCancelRetryQueue, {
      durable: true,
      messageTtl: this.config.retryDelayMs,
      deadLetterExchange: this.config.commandExchange,
      deadLetterRoutingKey: 'agendamento.cancel.requested',
    });
    await channel.bindQueue(this.config.agendamentoCancelRetryQueue, this.config.commandRetryExchange, 'agendamento.cancel.requested');
    await channel.assertQueue(this.config.agendamentoCancelDlq, { durable: true });
    await channel.bindQueue(this.config.agendamentoCancelDlq, this.config.commandDeadLetterExchange, 'agendamento.cancel.requested');
  }

  private async activateConsumers(): Promise<void> {
    const channel = this.requireChannel();
    this.consumerTags.length = 0;
    for (const registration of this.registrations) {
      const result = await channel.consume(registration.queue, (message) => {
        if (message) void registration.handler(message).catch((error) => this.logger.error(this.errorMessage(error)));
      }, { noAck: false });
      this.consumerTags.push(result.consumerTag);
    }
  }

  private async setupChannel(model: ChannelModel): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    this.channel = await model.createConfirmChannel();
    await this.channel.prefetch(10);
    await this.assertTopology();
    await this.activateConsumers();
    this.logger.log('RabbitMQ conectado e topology declarada');
  }

  private requireChannel(): ConfirmChannel {
    if (!this.channel) throw new Error('RabbitMQ indisponível');
    return this.channel;
  }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'erro desconhecido'; }
}

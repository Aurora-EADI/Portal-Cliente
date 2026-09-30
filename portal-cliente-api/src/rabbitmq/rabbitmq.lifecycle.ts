import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiAverbadaConsumer } from './consumers/di-averbada.consumer';
import { DiDesaverbadaConsumer } from './consumers/di-desaverbada.consumer';
import { AgendamentoCancelConsumer } from './consumers/agendamento-cancel.consumer';
import { AgendamentoStatusChangeConsumer } from './consumers/agendamento-status-change.consumer';
import { AverbacaoTiposDocumentoConsumer } from './consumers/averbacao-tipos-documento.consumer';
import { AverbacaoCommandConsumer } from './consumers/averbacao-command.consumer';
import { GestaoAcessoCommandConsumer } from './consumers/gestao-acesso-command.consumer';
import { TransportadorasConsumer } from './consumers/transportadoras.consumer';
import { JanelaCommandConsumer } from './consumers/janela-command.consumer';
import { RabbitMqService } from './rabbitmq.service';

@Injectable()
export class RabbitMqLifecycle implements OnApplicationBootstrap {
  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly diAverbadaConsumer: DiAverbadaConsumer,
    private readonly diDesaverbadaConsumer: DiDesaverbadaConsumer,
    private readonly agendamentoCancelConsumer: AgendamentoCancelConsumer,
    private readonly agendamentoStatusChangeConsumer: AgendamentoStatusChangeConsumer,
    private readonly averbacaoTiposDocumentoConsumer: AverbacaoTiposDocumentoConsumer,
    private readonly averbacaoCommandConsumer: AverbacaoCommandConsumer,
    private readonly gestaoAcessoCommandConsumer: GestaoAcessoCommandConsumer,
    private readonly transportadorasConsumer: TransportadorasConsumer,
    private readonly janelaCommandConsumer: JanelaCommandConsumer,
  ) {}
  onApplicationBootstrap(): void {
    this.diAverbadaConsumer.register();
    this.diDesaverbadaConsumer.register();
    this.agendamentoCancelConsumer.register();
    this.agendamentoStatusChangeConsumer.register();
    this.averbacaoTiposDocumentoConsumer.register();
    this.averbacaoCommandConsumer.register();
    this.gestaoAcessoCommandConsumer.register();
    this.transportadorasConsumer.register();
    this.janelaCommandConsumer.register();
    void this.rabbit.start();
  }
}

import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DisModule } from '../dis/dis.module';
import { TiposDocumentoModule } from '../tipos-documento/tipos-documento.module';
import { AverbacoesModule } from '../averbacoes/averbacoes.module';
import { DiAverbadaConsumer } from './consumers/di-averbada.consumer';
import { DiAverbadaInboxService } from './consumers/di-averbada-inbox.service';
import { DiDesaverbadaConsumer } from './consumers/di-desaverbada.consumer';
import { DiDesaverbadaInboxService } from './consumers/di-desaverbada-inbox.service';
import { OutboxService } from './publishers/outbox.service';
import { OutboxWorker } from './publishers/outbox.worker';
import { RabbitMqLifecycle } from './rabbitmq.lifecycle';
import { RabbitMqService } from './rabbitmq.service';
import { AgendamentoCancelConsumer } from './consumers/agendamento-cancel.consumer';
import { AgendamentoStatusChangeConsumer } from './consumers/agendamento-status-change.consumer';
import { AverbacaoTiposDocumentoConsumer } from './consumers/averbacao-tipos-documento.consumer';
import { AverbacaoCommandConsumer } from './consumers/averbacao-command.consumer';
import { GestaoAcessoCommandConsumer } from './consumers/gestao-acesso-command.consumer';
import { TransportadorasConsumer } from './consumers/transportadoras.consumer';
import { JanelaCommandConsumer } from './consumers/janela-command.consumer';
import { AgendamentoCommandInboxService } from './consumers/agendamento-command-inbox.service';
import { AgendamentoStatusChangeInboxService } from './consumers/agendamento-status-change-inbox.service';
import { AverbacaoTiposDocumentoInboxService } from './consumers/averbacao-tipos-documento-inbox.service';
import { AverbacaoCommandInboxService } from './consumers/averbacao-command-inbox.service';
import { GestaoAcessoCommandInboxService } from './consumers/gestao-acesso-command-inbox.service';
import { TransportadorasInboxService } from './consumers/transportadoras-inbox.service';
import { JanelaCommandInboxService } from './consumers/janela-command-inbox.service';
import { AgendamentoCancelService } from '../agendamento-commands/agendamento-cancel.service';
import { AgendamentoStatusChangeService } from '../agendamento-commands/agendamento-status-change.service';
import { AgendamentoCommandCompletedService } from '../agendamento-commands/agendamento-command-completed.service';
import { AgendamentoCommandRejectionService } from '../agendamento-commands/agendamento-command-rejection.service';
import { AgendamentoCommandTransactionService } from '../agendamento-commands/agendamento-command-transaction.service';
import { AgendamentoStatusService } from '../agendamento/agendamento-status.service';

@Module({
  imports: [PrismaModule, DisModule, TiposDocumentoModule, forwardRef(() => AverbacoesModule)],
  providers: [
    RabbitMqService,
    RabbitMqLifecycle,
    DiAverbadaInboxService,
    DiAverbadaConsumer,
    DiDesaverbadaInboxService,
    DiDesaverbadaConsumer,
    AgendamentoCancelConsumer,
    AgendamentoStatusChangeConsumer,
    AverbacaoTiposDocumentoConsumer,
    AverbacaoCommandConsumer,
    GestaoAcessoCommandConsumer,
    TransportadorasConsumer,
    JanelaCommandConsumer,
    AgendamentoCommandInboxService,
    AgendamentoStatusChangeInboxService,
    AverbacaoTiposDocumentoInboxService,
    AverbacaoCommandInboxService,
    GestaoAcessoCommandInboxService,
    TransportadorasInboxService,
    JanelaCommandInboxService,
    AgendamentoStatusService,
    AgendamentoCancelService,
    AgendamentoStatusChangeService,
    AgendamentoCommandCompletedService,
    AgendamentoCommandRejectionService,
    AgendamentoCommandTransactionService,
    OutboxService,
    OutboxWorker,
  ],
  exports: [RabbitMqService, OutboxService],
})
export class RabbitMqModule {}

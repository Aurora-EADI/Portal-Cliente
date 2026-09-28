import { Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import { AgendamentoStatusService } from './agendamento-status.service';
import { AgendamentoEventosModule } from './agendamento-eventos.module';

@Module({
  imports: [MailModule, PrismaModule, RabbitMqModule, AgendamentoEventosModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoService, AgendamentoStatusService],
  exports: [AgendamentoService, AgendamentoStatusService],
})
export class AgendamentoModule {}

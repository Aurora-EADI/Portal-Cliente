import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioModule } from '../minio/minio.module';
import { MailModule } from '../mail/mail.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import {
  ProcuracoesController,
  ProcuracoesServiceController,
} from './procuracoes.controller';
import { ProcuracoesService } from './procuracoes.service';
import { ProcuracoesEventos } from './procuracoes.eventos';

@Module({
  // RabbitMqModule pelo OutboxService: a procuração avisa o Portal Aurora.
  // forwardRef como em AverbacoesModule — o RabbitMqModule importa módulos de
  // domínio de volta.
  imports: [PrismaModule, MinioModule, MailModule, forwardRef(() => RabbitMqModule)],
  controllers: [ProcuracoesController, ProcuracoesServiceController],
  providers: [ProcuracoesService, ProcuracoesEventos],
  exports: [ProcuracoesService],
})
export class ProcuracoesModule {}

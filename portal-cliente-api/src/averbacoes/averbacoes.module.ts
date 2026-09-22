import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioModule } from '../minio/minio.module';
import { MailModule } from '../mail/mail.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import {
  AverbacoesController,
  AverbacoesServiceController,
} from './averbacoes.controller';
import { AverbacoesService } from './averbacoes.service';
import { AverbacoesEventos } from './averbacoes.eventos';

@Module({
  imports: [PrismaModule, MinioModule, MailModule, RabbitMqModule],
  controllers: [AverbacoesController, AverbacoesServiceController],
  providers: [AverbacoesService, AverbacoesEventos],
  exports: [AverbacoesService],
})
export class AverbacoesModule {}

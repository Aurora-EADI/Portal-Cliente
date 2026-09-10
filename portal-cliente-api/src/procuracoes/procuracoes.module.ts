import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioModule } from '../minio/minio.module';
import { MailModule } from '../mail/mail.module';
import {
  ProcuracoesController,
  ProcuracoesServiceController,
} from './procuracoes.controller';
import { ProcuracoesService } from './procuracoes.service';

@Module({
  imports: [PrismaModule, MinioModule, MailModule],
  controllers: [ProcuracoesController, ProcuracoesServiceController],
  providers: [ProcuracoesService],
  exports: [ProcuracoesService],
})
export class ProcuracoesModule {}

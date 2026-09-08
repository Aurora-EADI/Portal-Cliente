import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioModule } from '../minio/minio.module';
import {
  AverbacoesController,
  AverbacoesServiceController,
} from './averbacoes.controller';
import { AverbacoesService } from './averbacoes.service';

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [AverbacoesController, AverbacoesServiceController],
  providers: [AverbacoesService],
  exports: [AverbacoesService],
})
export class AverbacoesModule {}

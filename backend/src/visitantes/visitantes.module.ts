import { Module } from '@nestjs/common';
import { VisitantesService } from './visitantes.service';
import { VisitantesController } from './visitantes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VisitantesController],
  providers: [VisitantesService],
  exports: [VisitantesService],
})
export class VisitantesModule {}

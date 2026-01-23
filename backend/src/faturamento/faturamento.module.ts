import { Module } from '@nestjs/common';
import { FaturamentoService } from './faturamento.service';
import { FaturamentoController } from './faturamento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FaturamentoController],
  providers: [FaturamentoService],
})
export class FaturamentoModule {}

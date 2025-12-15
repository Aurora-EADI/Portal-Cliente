import { Module } from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { SimulationsController } from './simulations.controller';
import { CalculationService } from './calculation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, CalculationService],
  exports: [SimulationsService, CalculationService],
})
export class SimulationsModule {}

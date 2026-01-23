import { Module } from '@nestjs/common';
import { ServiceCostsService } from './service-costs.service';
import { ServiceCostsController } from './service-costs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceCostsController],
  providers: [ServiceCostsService],
  exports: [ServiceCostsService],
})
export class ServiceCostsModule {}

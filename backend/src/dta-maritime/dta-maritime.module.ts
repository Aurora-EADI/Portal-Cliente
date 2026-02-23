import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DtaMaritimeController } from './dta-maritime.controller';
import { DtaMaritimeService } from './dta-maritime.service';

@Module({
  imports: [PrismaModule],
  controllers: [DtaMaritimeController],
  providers: [DtaMaritimeService],
})
export class DtaMaritimeModule {}

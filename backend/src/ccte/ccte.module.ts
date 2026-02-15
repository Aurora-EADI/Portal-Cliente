import { Module } from '@nestjs/common';
import { CcteService } from './ccte.service';
import { CcteController } from './ccte.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CcteController],
  providers: [CcteService],
})
export class CcteModule {}

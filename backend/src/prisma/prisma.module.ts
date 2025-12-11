import { Global, Module } from '@nestjs/common';
import { PrismaPostgresService as PrismaService } from './prisma.service';
import { PrismaSqlServerService as PrismaServiceSql } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, PrismaServiceSql],
  exports: [PrismaService, PrismaServiceSql]
})
export class PrismaModule { }

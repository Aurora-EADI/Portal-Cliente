import { Global, Module } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "./prisma.service";
// import { PrismaSqlServerService as PrismaServiceSql } from './prisma.service'; // DEPRECATED: Substituído por SqlServerService
import { SqlServerService } from "./sqlserver.service";

@Global()
@Module({
  providers: [
    PrismaService,
    SqlServerService, // Novo serviço usando mssql/tedious (substituiu PrismaSqlServerService)
  ],
  exports: [PrismaService, SqlServerService],
})
export class PrismaModule {}

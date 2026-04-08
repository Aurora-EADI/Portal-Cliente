import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralAuditController } from "./warehouse-general-audit.controller";
import { WarehouseGeneralAuditQueryService } from "./warehouse-general-audit.query.service";

@Module({
  imports: [ArmazemGeralContextModule],
  controllers: [WarehouseGeneralAuditController],
  providers: [WarehouseGeneralAuditQueryService],
})
export class WarehouseGeneralAuditModule {}

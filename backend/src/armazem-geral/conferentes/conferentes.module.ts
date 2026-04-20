import { Module } from "@nestjs/common";
import { ConferentesService } from "./conferentes.service";
import { ConferentesController } from "./conferentes.controller";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralAuditModule } from "../audit/warehouse-general-audit.module";

@Module({
  imports: [ArmazemGeralContextModule, WarehouseGeneralAuditModule],
  controllers: [ConferentesController],
  providers: [ConferentesService],
  exports: [ConferentesService],
})
export class ConferentesModule {}

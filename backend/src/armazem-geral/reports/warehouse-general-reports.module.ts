import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralReportsController } from "./warehouse-general-reports.controller";
import { WarehouseGeneralReportsService } from "./warehouse-general-reports.service";

@Module({
  imports: [ArmazemGeralContextModule],
  controllers: [WarehouseGeneralReportsController],
  providers: [WarehouseGeneralReportsService],
})
export class WarehouseGeneralReportsModule {}

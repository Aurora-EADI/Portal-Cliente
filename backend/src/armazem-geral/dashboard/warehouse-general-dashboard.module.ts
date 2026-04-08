import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralDashboardController } from "./warehouse-general-dashboard.controller";
import { WarehouseGeneralDashboardService } from "./warehouse-general-dashboard.service";

@Module({
  imports: [ArmazemGeralContextModule],
  controllers: [WarehouseGeneralDashboardController],
  providers: [WarehouseGeneralDashboardService],
})
export class WarehouseGeneralDashboardModule {}

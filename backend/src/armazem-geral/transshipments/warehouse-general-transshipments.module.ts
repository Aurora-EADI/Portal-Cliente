import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralTransshipmentsController } from "./warehouse-general-transshipments.controller";
import { WarehouseGeneralTransshipmentsService } from "./warehouse-general-transshipments.service";

@Module({
  imports: [ArmazemGeralContextModule],
  controllers: [WarehouseGeneralTransshipmentsController],
  providers: [WarehouseGeneralTransshipmentsService],
})
export class WarehouseGeneralTransshipmentsModule {}

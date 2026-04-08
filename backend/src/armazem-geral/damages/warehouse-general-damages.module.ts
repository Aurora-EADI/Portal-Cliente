import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralDamagesController } from "./warehouse-general-damages.controller";
import { WarehouseGeneralDamagesService } from "./warehouse-general-damages.service";

@Module({
  imports: [ArmazemGeralContextModule],
  controllers: [WarehouseGeneralDamagesController],
  providers: [WarehouseGeneralDamagesService],
})
export class WarehouseGeneralDamagesModule {}

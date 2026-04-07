import { Module } from "@nestjs/common";
import { ArmazemGeralContextModule } from "../armazem-geral-context.module";
import { WarehouseGeneralCargoController } from "./warehouse-general-cargo.controller";
import { WarehouseGeneralCargoService } from "./warehouse-general-cargo.service";

@Module({
  imports: [ArmazemGeralContextModule],
  controllers: [WarehouseGeneralCargoController],
  providers: [WarehouseGeneralCargoService],
})
export class WarehouseGeneralCargoModule {}

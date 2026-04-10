import { Module } from "@nestjs/common";
import { ConferenciaCargaController } from "./conferencia-carga.controller";
import { ConferenciaCargaService } from "./conferencia-carga.service";

@Module({
  controllers: [ConferenciaCargaController],
  providers: [ConferenciaCargaService],
})
export class ConferenciaCargaModule {}

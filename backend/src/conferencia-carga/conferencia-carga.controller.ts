import { Controller, Get } from "@nestjs/common";
import { ConferenciaCargaService } from "./conferencia-carga.service";

@Controller("conferencia-carga")
export class ConferenciaCargaController {
  constructor(
    private readonly conferenciaCargaService: ConferenciaCargaService,
  ) {}

  @Get()
  async findOpen() {
    return this.conferenciaCargaService.findOpen();
  }
}

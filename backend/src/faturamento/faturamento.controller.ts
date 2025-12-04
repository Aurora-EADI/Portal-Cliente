// faturamento/faturamento.controller.ts
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FaturamentoService } from './faturamento.service';
import { FaturamentoQueryDto } from './dto/faturamentoDetalahdo.dto'

@Controller('faturamento')
export class FaturamentoController {
  constructor(private readonly faturamentoService: FaturamentoService) { }

  @Get()
  async findAll(@Query() query: FaturamentoQueryDto) {
    const { data_inicial, data_final } = query;

    const inicio = data_inicial ? new Date(data_inicial) : undefined;
    const fim = data_final ? new Date(data_final) : undefined;

    return this.faturamentoService.findAll(inicio, fim);
  }
}
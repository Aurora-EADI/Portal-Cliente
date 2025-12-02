// faturamento/faturamento.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FaturamentoService } from './faturamento.service';
import { Faturamento } from '@prisma/client';

@Controller('faturamento')
export class FaturamentoController {
  constructor(private readonly faturamentoService: FaturamentoService) {}

  @Get()
  async findAll(): Promise<Faturamento[]> {
    return this.faturamentoService.findAll();
  }

  // Endpoint: GET /faturamento/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Faturamento> {
    const faturamento = await this.faturamentoService.findOne(id);
    if (!faturamento) {
      throw new Error('Faturamento não encontrado'); 
    }
    return faturamento;
  }

}
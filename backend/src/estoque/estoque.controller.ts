import { Controller, Get, Query } from "@nestjs/common";
import { EstoqueService } from "./estoque.service";
import { EstoqueQueryDto } from "./dto/estoqueQuery.dto";

@Controller("estoque")
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get()
  async findAll(@Query() query: EstoqueQueryDto) {
    const { dt_inicio, dt_fim, n_lote, cliente, report_type } = query;
    return this.estoqueService.findAll(dt_inicio, dt_fim, n_lote, cliente, report_type);
  }
}


import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VisitantesService } from './visitantes.service';
import { UpdateVisitanteStatusDto } from './dto/update-visitante-status.dto';
import { VisitantesSummaryQueryDto } from './dto/visitantes-summary-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, VisitanteStatus } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('visitantes')
@Controller('visitantes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
export class VisitantesController {
  constructor(private readonly visitantesService: VisitantesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar visitantes com filtros opcionais' })
  findAll(
    @Query('nome') nome?: string,
    @Query('status') status?: VisitanteStatus,
    @Query('data') data?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.visitantesService.findAll({ nome, status, data, dataInicio, dataFim, page, limit });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Contagem de visitantes agrupada por status' })
  findSummary(@Query() query: VisitantesSummaryQueryDto) {
    return this.visitantesService.findSummary(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar visitante por ID' })
  findOne(@Param('id') id: string) {
    return this.visitantesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do visitante (PRESENTE ou NAO_COMPARECEU)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVisitanteStatusDto,
  ) {
    return this.visitantesService.updateStatus(id, dto);
  }
}

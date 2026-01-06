import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateNewVersionDto } from './dto/create-new-version.dto';
import { AddSimulationServiceDto } from './dto/add-simulation-service.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Simulações')
@ApiBearerAuth()
@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) { }

  @Post()
  @ApiOperation({ summary: 'Criar nova simulação de custo' })
  @ApiResponse({ status: 201, description: 'Simulação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createSimulationDto: CreateSimulationDto, @Request() req) {
    return this.simulationsService.create(createSimulationDto, req.user.id);
  }

  @Post('new-version')
  @ApiOperation({ summary: 'Criar nova versão de uma simulação existente' })
  @ApiResponse({ status: 201, description: 'Nova versão criada com sucesso' })
  @ApiResponse({ status: 404, description: 'Simulação base não encontrada' })
  createNewVersion(@Body() createNewVersionDto: CreateNewVersionDto, @Request() req) {
    return this.simulationsService.createNewVersion(createNewVersionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as simulações' })
  @ApiQuery({ name: 'supplierId', required: false, description: 'Filtrar por fornecedor' })
  @ApiResponse({ status: 200, description: 'Lista de simulações retornada com sucesso' })
  findAll(@Query('supplierId') supplierId?: string, @Request() req?) {
    return this.simulationsService.findAll(req?.user?.id, supplierId);
  }

  @Get('version-history/:simulationNumber')
  @ApiOperation({ summary: 'Obter histórico de versões de uma simulação' })
  @ApiResponse({ status: 200, description: 'Histórico de versões retornado com sucesso' })
  getVersionHistory(@Param('simulationNumber') simulationNumber: string) {
    return this.simulationsService.getVersionHistory(simulationNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma simulação específica' })
  @ApiResponse({ status: 200, description: 'Simulação encontrada' })
  @ApiResponse({ status: 404, description: 'Simulação não encontrada' })
  findOne(@Param('id') id: string) {
    return this.simulationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados de uma simulação' })
  @ApiResponse({ status: 200, description: 'Simulação atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Simulação não encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateSimulationDto: UpdateSimulationDto,
  ) {
    return this.simulationsService.update(id, updateSimulationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma simulação' })
  @ApiResponse({ status: 200, description: 'Simulação deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Simulação não encontrada' })
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(id);
  }

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  @Post(':id/services')
  @ApiOperation({ summary: 'Adicionar serviço a uma simulação' })
  @ApiResponse({ status: 201, description: 'Serviço adicionado com sucesso' })
  @ApiResponse({ status: 404, description: 'Simulação não encontrada' })
  addService(
    @Param('id') id: string,
    @Body() addSimulationServiceDto: AddSimulationServiceDto,
    @Request() req,
  ) {
    return this.simulationsService.addService(id, addSimulationServiceDto, req.user.id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Listar todos os serviços de uma simulação' })
  @ApiResponse({ status: 200, description: 'Lista de serviços retornada com sucesso' })
  getServices(@Param('id') id: string) {
    return this.simulationsService.getServices(id);
  }

  @Delete(':id/services/:serviceId')
  @ApiOperation({ summary: 'Remover serviço de uma simulação' })
  @ApiResponse({ status: 200, description: 'Serviço removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço ou simulação não encontrados' })
  removeService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.simulationsService.removeService(id, serviceId);
  }
}

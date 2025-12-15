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
import { SimulationsService } from './simulations.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { CreateNewVersionDto } from './dto/create-new-version.dto';
import { AddSimulationServiceDto } from './dto/add-simulation-service.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) { }

  @Post()
  create(@Body() createSimulationDto: CreateSimulationDto, @Request() req) {
    return this.simulationsService.create(createSimulationDto, req.user.id);
  }

  @Post('new-version')
  createNewVersion(@Body() createNewVersionDto: CreateNewVersionDto, @Request() req) {
    return this.simulationsService.createNewVersion(createNewVersionDto, req.user.id);
  }

  @Get()
  findAll(@Query('supplierId') supplierId?: string, @Request() req?) {
    return this.simulationsService.findAll(req?.user?.id, supplierId);
  }

  @Get('version-history/:simulationNumber')
  getVersionHistory(@Param('simulationNumber') simulationNumber: string) {
    return this.simulationsService.getVersionHistory(simulationNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simulationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSimulationDto: UpdateSimulationDto,
  ) {
    return this.simulationsService.update(id, updateSimulationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(id);
  }

  // ========== GERENCIAMENTO DE SERVIÇOS ==========

  @Post(':id/services')
  addService(
    @Param('id') id: string,
    @Body() addSimulationServiceDto: AddSimulationServiceDto,
    @Request() req,
  ) {
    return this.simulationsService.addService(id, addSimulationServiceDto, req.user.id);
  }

  @Get(':id/services')
  getServices(@Param('id') id: string) {
    return this.simulationsService.getServices(id);
  }

  @Delete(':id/services/:serviceId')
  removeService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.simulationsService.removeService(id, serviceId);
  }
}

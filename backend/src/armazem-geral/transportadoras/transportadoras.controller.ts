import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TransportadorasService } from './transportadoras.service';
import { CreateTransportadoraDto } from './dto/create-transportadora.dto';
import { UpdateTransportadoraDto } from './dto/update-transportadora.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Transportadoras (Armazém Geral)')
@Controller('armazem-geral/transportadoras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportadorasController {
  constructor(private readonly service: TransportadorasService) {}

  // ─── TRANSPORTADORAS ──────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar nova transportadora' })
  create(@Body() dto: CreateTransportadoraDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar transportadoras' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    const activeValue = active === undefined ? true : active === 'true';
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      active: activeValue,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Obter transportadora pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar transportadora' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransportadoraDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/reativar')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Reativar transportadora inativa' })
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.reactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar (inativar) transportadora' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }

  // ─── MOTORISTAS ───────────────────────────────────────────────────────────

  @Get(':id/motoristas')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar motoristas da transportadora' })
  findAllDrivers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllDrivers(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Post(':id/motoristas')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar motorista na transportadora' })
  createDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDriverDto,
  ) {
    return this.service.createDriver(id, dto);
  }

  @Patch(':id/motoristas/:driverId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar motorista' })
  updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.service.updateDriver(id, driverId, dto);
  }

  @Patch(':id/motoristas/:driverId/toggle-ativo')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Alternar status ativo/inativo do motorista' })
  toggleDriverActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ) {
    return this.service.toggleDriverActive(id, driverId);
  }

  @Delete(':id/motoristas/:driverId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover motorista' })
  removeDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ) {
    return this.service.removeDriver(id, driverId);
  }

  // ─── VEÍCULOS ─────────────────────────────────────────────────────────────

  @Get(':id/veiculos')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Listar veículos da transportadora' })
  findAllVehicles(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllVehicles(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Post(':id/veiculos')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar veículo na transportadora' })
  createVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.service.createVehicle(id, dto);
  }

  @Patch(':id/veiculos/:vehicleId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar veículo' })
  updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.service.updateVehicle(id, vehicleId, dto);
  }

  @Patch(':id/veiculos/:vehicleId/toggle-ativo')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Alternar status ativo/inativo do veículo' })
  toggleVehicleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.service.toggleVehicleActive(id, vehicleId);
  }

  @Delete(':id/veiculos/:vehicleId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover veículo' })
  removeVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.service.removeVehicle(id, vehicleId);
  }
}

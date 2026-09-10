import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VeiculosService } from './veiculos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateVeiculosDto } from './dto/create-veiculos.dto';
import { UpdateVeiculosDto } from './dto/update-veiculos.dto';

@Controller('agendamento/veiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VeiculosController {
  constructor(private readonly service: VeiculosService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: CreateVeiculosDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVeiculosDto) { return this.service.update(id, dto); }
}

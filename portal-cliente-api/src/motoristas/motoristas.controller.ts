import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MotoristasService } from './motoristas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateMotoristasDto } from './dto/create-motoristas.dto';
import { UpdateMotoristasDto } from './dto/update-motoristas.dto';

@Controller('agendamento/motoristas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MotoristasController {
  constructor(private readonly service: MotoristasService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: CreateMotoristasDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMotoristasDto) { return this.service.update(id, dto); }
}

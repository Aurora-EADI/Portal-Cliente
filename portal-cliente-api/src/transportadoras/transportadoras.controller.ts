import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TransportadorasService } from './transportadoras.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateTransportadorasDto } from './dto/create-transportadoras.dto';
import { UpdateTransportadorasDto } from './dto/update-transportadoras.dto';

@Controller('agendamento/transportadoras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportadorasController {
  constructor(private readonly service: TransportadorasService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: CreateTransportadorasDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransportadorasDto) { return this.service.update(id, dto); }
}

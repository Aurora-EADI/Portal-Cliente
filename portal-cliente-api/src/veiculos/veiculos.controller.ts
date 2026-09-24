import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { VeiculosService } from './veiculos.service';
import { BetterAuthDomainGuard } from '../common/guards/better-auth-domain.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateVeiculosDto } from './dto/create-veiculos.dto';
import { UpdateVeiculosDto } from './dto/update-veiculos.dto';

@Controller('agendamento/veiculos')
@UseGuards(BetterAuthDomainGuard, RolesGuard)
export class VeiculosController {
  constructor(private readonly service: VeiculosService) {}

  @Get()
  findAll(@Req() req: Request, @Query('clienteId') clienteId?: string) {
    return this.service.findAll(req.user as User, clienteId);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateVeiculosDto) {
    return this.service.create(req.user as User, dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateVeiculosDto) {
    return this.service.update(req.user as User, id, dto);
  }
}

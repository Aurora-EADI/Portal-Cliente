import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { MotoristasService } from './motoristas.service';
import { BetterAuthDomainGuard } from '../common/guards/better-auth-domain.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMotoristasDto } from './dto/create-motoristas.dto';
import { UpdateMotoristasDto } from './dto/update-motoristas.dto';

@Controller('agendamento/motoristas')
@UseGuards(BetterAuthDomainGuard, RolesGuard)
export class MotoristasController {
  constructor(private readonly service: MotoristasService) {}

  @Get()
  findAll(@Req() req: Request, @Query('clienteId') clienteId?: string) {
    return this.service.findAll(req.user as User, clienteId);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateMotoristasDto) {
    return this.service.create(req.user as User, dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateMotoristasDto) {
    return this.service.update(req.user as User, id, dto);
  }
}

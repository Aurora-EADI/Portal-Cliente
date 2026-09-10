import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JanelasService } from './janelas.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateJanelasDto } from './dto/create-janelas.dto';
import { UpdateJanelasDto } from './dto/update-janelas.dto';

@Controller('agendamento/janelas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JanelasController {
  constructor(private readonly service: JanelasService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: CreateJanelasDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJanelasDto) { return this.service.update(id, dto); }
}

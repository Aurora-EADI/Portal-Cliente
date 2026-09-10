import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DisService } from './dis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateDisDto } from './dto/create-dis.dto';
import { UpdateDisDto } from './dto/update-dis.dto';

@Controller('agendamento/dis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisController {
  constructor(private readonly service: DisService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: CreateDisDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDisDto) { return this.service.update(id, dto); }
}

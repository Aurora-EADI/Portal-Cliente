import { Controller, Get, Post, Patch, Param, Body, Req, Sse, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { User, UserRole } from '@prisma/client';
import { DisService } from './dis.service';
import { DisAverbadasEventos } from './dis.eventos';
import { BetterAuthDomainGuard } from '../common/guards/better-auth-domain.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDisDto } from './dto/create-dis.dto';
import { UpdateDisDto } from './dto/update-dis.dto';

@Controller('agendamento/dis')
@UseGuards(BetterAuthDomainGuard, RolesGuard)
export class DisController {
  constructor(private readonly service: DisService) {}

  @Get()
  @Roles(UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.ADMIN, UserRole.EMPLOYEE)
  findAll(@Req() req: Request) {
    return this.service.findAll(req.user as User);
  }

  @Post()
  create(@Body() dto: CreateDisDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDisDto) {
    return this.service.update(id, dto);
  }
}

/**
 * Stream do dashboard: empurra a DI averbada assim que ela chega do Aurora, sem
 * F5. Caminho separado (`/dis-averbadas/stream`) porque é o que o hook do front
 * já consome. A lista continua sendo a fonte de verdade; o evento traz a DI já
 * no mesmo shape para o merge otimista do dashboard.
 */
@Controller('dis-averbadas')
@UseGuards(BetterAuthDomainGuard, RolesGuard)
export class DisAverbadasStreamController {
  constructor(private readonly eventos: DisAverbadasEventos) {}

  @Sse('stream')
  @Roles(UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.ADMIN, UserRole.EMPLOYEE)
  stream(@Req() req: Request) {
    return this.eventos.paraUsuario(req.user as User);
  }
}

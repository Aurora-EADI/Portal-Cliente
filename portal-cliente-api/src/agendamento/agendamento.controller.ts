import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { AgendamentoService } from './agendamento.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('agendamento')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
export class AgendamentoController {
  constructor(private fcl: AgendamentoService) {}

  @Get('atribuicoes')
  @Roles(UserRole.CLIENTE, UserRole.DESPACHANTE)
  findAtribuicoes(@Req() request: Request, @Query('nLote') nLote?: string) {
    return this.fcl.findAtribuicoes(request.user as User, nLote);
  }

  @Get('transportadoras-conta')
  @Roles(UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA)
  findTransportadorasConta() { return this.fcl.findTransportadorasConta(); }

  // AGENDAMENTOS
  @Get('agendamentos')
  findAllAgendamentos(@Query('clienteId') clienteId?: string) { return this.fcl.findAllAgendamentos(clienteId); }

  @Get('agendamentos/historico')
  findHistorico(@Query('clienteId') clienteId?: string) { return this.fcl.findHistorico(clienteId); }

  @Post('agendamentos')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE)
  createAgendamento(@Body() body: any) { return this.fcl.createAgendamento(body); }

  @Patch('agendamentos/:id/cancelar')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE)
  cancelarAgendamento(@Param('id') id: string) { return this.fcl.cancelarAgendamento(id); }

  // SLOT RESERVAS
  @Post('reservas')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE)
  reservarSlot(@Body() body: { data: string; horario: string; diId: string; vagasTotais: number }) {
    return this.fcl.reservarSlot(body.data, body.horario, body.diId, body.vagasTotais);
  }

  @Delete('reservas/:id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE)
  liberarSlot(@Param('id') id: string) { return this.fcl.liberarSlot(id); }

  @Get('slots/disponibilidade')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE)
  getDisponibilidade(@Query('data') data: string, @Query('horario') horario: string) {
    return this.fcl.getDisponibilidade(data, horario);
  }

  @Get('reservas/check')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE)
  verificarHoldDI(@Query('diId') diId: string) { return this.fcl.verificarHoldDI(diId); }
}

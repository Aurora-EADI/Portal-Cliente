import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  // CLIENTES
  @Get('clientes')
  findAllClientes() { return this.fcl.findAllClientes(); }

  @Post('clientes')
  createCliente(@Body() body: any) { return this.fcl.createCliente(body); }

  @Patch('clientes/:id')
  updateCliente(@Param('id') id: string, @Body() body: any) { return this.fcl.updateCliente(id, body); }

  // DIs
  @Get('dis')
  findAllDIs(@Query('clienteId') clienteId?: string) { return this.fcl.findAllDIs(clienteId); }

  @Post('dis')
  createDI(@Body() body: any) { return this.fcl.createDI(body); }

  @Patch('dis/:id')
  updateDI(@Param('id') id: string, @Body() body: any) { return this.fcl.updateDI(id, body); }

  // MOTORISTAS
  @Get('motoristas')
  findAllMotoristas(@Query('clienteId') clienteId?: string) { return this.fcl.findAllMotoristas(clienteId); }

  @Post('motoristas')
  createMotorista(@Body() body: any) { return this.fcl.createMotorista(body); }

  @Patch('motoristas/:id')
  updateMotorista(@Param('id') id: string, @Body() body: any) { return this.fcl.updateMotorista(id, body); }

  // VEÍCULOS
  @Get('veiculos')
  findAllVeiculos(@Query('clienteId') clienteId?: string) { return this.fcl.findAllVeiculos(clienteId); }

  @Post('veiculos')
  createVeiculo(@Body() body: any) { return this.fcl.createVeiculo(body); }

  @Patch('veiculos/:id')
  updateVeiculo(@Param('id') id: string, @Body() body: any) { return this.fcl.updateVeiculo(id, body); }

  // JANELAS
  @Get('janelas')
  findAllJanelas() { return this.fcl.findAllJanelas(); }

  @Post('janelas')
  @Roles(UserRole.ADMIN)
  createJanela(@Body() body: any) { return this.fcl.createJanela(body); }

  @Patch('janelas/:id')
  @Roles(UserRole.ADMIN)
  updateJanela(@Param('id') id: string, @Body() body: any) { return this.fcl.updateJanela(id, body); }

  @Delete('janelas/:id')
  @Roles(UserRole.ADMIN)
  deleteJanela(@Param('id') id: string) { return this.fcl.deleteJanela(id); }

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

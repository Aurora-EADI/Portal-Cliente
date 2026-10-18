import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ServiceKeyGuard } from '../common/guards/service-key.guard';
import { ServiceIntegrationService } from './service.service';
import { ListAgendamentosDto } from './dto/list-agendamentos.dto';
import { UpdateAgendamentoStatusDto } from './dto/update-agendamento-status.dto';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CreateJanelaDto } from './dto/create-janela.dto';
import { UpdateJanelaDto } from './dto/update-janela.dto';
import { SetUserActiveDto } from './dto/set-user-active.dto';
import { ListUsersDto } from './dto/list-users.dto';

@Controller('service')
@UseGuards(ServiceKeyGuard)
export class ServiceIntegrationController {
  constructor(private readonly service: ServiceIntegrationService) {}
  @Get('agendamentos') listAgendamentos(@Query() q: ListAgendamentosDto) { return this.service.listAgendamentos(q); }
  @Post('agendamentos') createAgendamento(@Body() b: CreateAgendamentoDto) { return this.service.createAgendamento(b); }
  @Patch('agendamentos/:id/status') updateAgendamentoStatus(@Param('id') id: string, @Body() b: UpdateAgendamentoStatusDto) { return this.service.updateAgendamentoStatus(id, b); }
  @Get('atribuicoes-pendentes-whatsapp') assignments() { return this.service.listWhatsappAssignments(); }
  @Patch('atribuicoes-pendentes-whatsapp/:id') assignmentDone(@Param('id') id: string) { return this.service.setAssignmentWhatsapp(id); }
  @Get('whatsapp-pendentes') bookings() { return this.service.listWhatsappBookings(); }
  @Patch('whatsapp-pendentes/:id') bookingDone(@Param('id') id: string) { return this.service.setBookingWhatsapp(id); }
  @Post('convites') createInvite(@Body() b: CreateInviteDto) { return this.service.createInvite(b); }
  @Get('convites') invites() { return this.service.listInvites(); }
  @Delete('convites/:id') revokeInvite(@Param('id') id: string) { return this.service.deleteInvite(id); }
  @Get('users') users(@Query() q: ListUsersDto) { return this.service.listUsers(q); }
  @Patch('users/:id/active') active(@Param('id') id: string, @Body() dto: SetUserActiveDto) { return this.service.setUserActive(id, dto.active); }
  @Get('janelas') windows() { return this.service.listJanelas(); }
  @Post('janelas') createWindow(@Body() b: CreateJanelaDto) { return this.service.createJanela(b); }
  @Patch('janelas/:id') updateWindow(@Param('id') id: string, @Body() b: UpdateJanelaDto) { return this.service.updateJanela(id, b); }
  @Delete('janelas/:id') deleteWindow(@Param('id') id: string) { return this.service.deleteJanela(id); }
  @Post('transportadoras/batch') syncCarriers(@Body('items') items: any[]) { return this.service.syncTransportadoras(items); }
}

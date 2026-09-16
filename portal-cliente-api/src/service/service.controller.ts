import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ServiceKeyGuard } from '../common/guards/service-key.guard';
import { ServiceIntegrationService } from './service.service';

@Controller('service')
@UseGuards(ServiceKeyGuard)
export class ServiceIntegrationController {
  constructor(private readonly service: ServiceIntegrationService) {}
  @Get('agendamentos') listAgendamentos(@Query() q: any) { return this.service.listAgendamentos(q); }
  @Post('agendamentos') createAgendamento(@Body() b: any) { return this.service.createAgendamento(b); }
  @Patch('agendamentos/:id/status') updateStatus(@Param('id') id: string, @Body('status') status: string) { return this.service.updateAgendamentoStatus(id, status); }
  @Get('atribuicoes-pendentes-whatsapp') assignments() { return this.service.listWhatsappAssignments(); }
  @Patch('atribuicoes-pendentes-whatsapp/:id') assignmentDone(@Param('id') id: string) { return this.service.setAssignmentWhatsapp(id); }
  @Get('whatsapp-pendentes') bookings() { return this.service.listWhatsappBookings(); }
  @Patch('whatsapp-pendentes/:id') bookingDone(@Param('id') id: string) { return this.service.setBookingWhatsapp(id); }
  @Post('convites') createInvite(@Body() b: any) { return this.service.createInvite(b); }
  @Get('convites') invites() { return this.service.listInvites(); }
  @Delete('convites/:id') revokeInvite(@Param('id') id: string) { return this.service.deleteInvite(id); }
  @Get('users') users(@Query() q: any) { return this.service.listUsers(q); }
  @Patch('users/:id/active') active(@Param('id') id: string, @Body('active') active: boolean) { return this.service.setUserActive(id, active); }
  @Get('janelas') windows() { return this.service.listJanelas(); }
  @Post('janelas') createWindow(@Body() b: any) { return this.service.createJanela(b); }
  @Patch('janelas/:id') updateWindow(@Param('id') id: string, @Body() b: any) { return this.service.updateJanela(id, b); }
  @Delete('janelas/:id') deleteWindow(@Param('id') id: string) { return this.service.deleteJanela(id); }
  @Post('transportadoras/batch') syncCarriers(@Body('items') items: any[]) { return this.service.syncTransportadoras(items); }
  @Get('dis-averbadas') dis(@Query() q: any) { return this.service.listDis(q); }
  @Post('dis-averbadas') syncDis(@Body() b: any) { return this.service.syncDis(b.items ? b.items : [b]); }
  @Post('dis-averbadas/batch') syncDisBatch(@Body('items') items: any[]) { return this.service.syncDis(items); }
  @Delete('dis-averbadas/:nLote') deleteDis(@Param('nLote') nLote: string) { return this.service.deleteDis(decodeURIComponent(nLote)); }
}

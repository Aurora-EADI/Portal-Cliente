import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AgendamentoStatus, UserRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AgendamentoStatusService } from '../agendamento/agendamento-status.service';
import { ListAgendamentosDto } from './dto/list-agendamentos.dto';

const ACTIVE_STATUSES = [AgendamentoStatus.ATIVO, AgendamentoStatus.AG_CHEGADA, AgendamentoStatus.CHEGOU, AgendamentoStatus.ON_TIME, AgendamentoStatus.ATRASADO, AgendamentoStatus.CONCLUIDO];

@Injectable()
export class ServiceIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly agendamentoStatus: AgendamentoStatusService,
  ) {}

  async listAgendamentos(query: ListAgendamentosDto) {
    const status = query.status && Object.values(AgendamentoStatus).includes(query.status as AgendamentoStatus)
      ? query.status as AgendamentoStatus
      : undefined;
    const statuses = query.excludeConcluido === '1' ? ACTIVE_STATUSES.filter((s) => s !== AgendamentoStatus.CONCLUIDO) : ACTIVE_STATUSES;
    const where: Prisma.AgendamentoWhereInput = {
      status: status ?? { in: statuses },
      ...(query.clienteId ? { OR: [{ di: { clienteId: query.clienteId } }, { clienteId: query.clienteId }] } : {}),
      ...(query.cnpjCliente ? { cliente: { cnpj: query.cnpjCliente } } : {}),
      ...(query.dataInicio || query.dataFim ? { data: { ...(query.dataInicio ? { gte: query.dataInicio } : {}), ...(query.dataFim ? { lte: query.dataFim } : {}) } } : {}),
    };
    const include = {
      di: { include: { cliente: { select: { id: true, nome: true } } } },
      motorista: true,
      veiculo: true,
      cliente: { select: { id: true, nome: true } },
    } as const;

    const isBootstrap = query.bootstrapLimit !== undefined
      || query.bootstrapCursorCreatedEm !== undefined
      || query.bootstrapCursorId !== undefined;
    if (!isBootstrap) {
      return this.prisma.agendamento.findMany({ where, include, orderBy: { criadoEm: 'desc' }, take: 500 })
        .then((data) => ({ data, total: data.length, timestamp: new Date().toISOString() }));
    }

    const bootstrapLimit = query.bootstrapLimit ?? 200;
    const cursorCreatedEm = query.bootstrapCursorCreatedEm ? new Date(query.bootstrapCursorCreatedEm) : undefined;
    const cursorId = query.bootstrapCursorId;
    const cursorWhere = cursorCreatedEm && cursorId
      ? {
          OR: [
            { criadoEm: { gt: cursorCreatedEm } },
            { criadoEm: cursorCreatedEm, id: { gt: cursorId } },
          ],
        }
      : {};
    const rows = await this.prisma.agendamento.findMany({
      where: { ...where, ...cursorWhere },
      include,
      orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
      take: bootstrapLimit + 1,
    });
    const data = rows.slice(0, bootstrapLimit);
    const last = data.length ? data[data.length - 1] : null;
    return {
      data,
      total: data.length,
      timestamp: new Date().toISOString(),
      nextCursor: rows.length > bootstrapLimit && last
        ? { criadoEm: last.criadoEm.toISOString(), id: last.id }
        : null,
    };
  }

  async createAgendamento(body: any) {
    if (!body.empresa || !body.operacao || !body.data || !body.horario || !body.cpfMotorista || !body.placaVeiculo) throw new BadRequestException('Campos obrigatórios: empresa, operacao, data, horario, cpfMotorista, placaVeiculo');
    let cliente = await this.prisma.cliente.findFirst({ where: { nome: { contains: body.empresa, mode: 'insensitive' } } });
    if (!cliente) cliente = await this.prisma.cliente.create({ data: { nome: body.empresa } });
    const cpf = String(body.cpfMotorista).replace(/\D/g, '');
    let motorista = (await this.prisma.motorista.findMany({ where: { clienteId: cliente.id } })).find((m) => m.cpf.replace(/\D/g, '') === cpf);
    if (!motorista) motorista = await this.prisma.motorista.create({ data: { clienteId: cliente.id, nome: body.nomeMotorista || body.cpfMotorista, cpf: body.cpfMotorista, cnh: '', telefone: '' } });
    else if (body.nomeMotorista && motorista.nome !== body.nomeMotorista) motorista = await this.prisma.motorista.update({ where: { id: motorista.id }, data: { nome: body.nomeMotorista } });
    const placa = String(body.placaVeiculo).replace(/\s/g, '').toUpperCase();
    let veiculo = await this.prisma.veiculo.findFirst({ where: { clienteId: cliente.id, placa: { contains: placa, mode: 'insensitive' } } });
    if (!veiculo) veiculo = await this.prisma.veiculo.create({ data: { clienteId: cliente.id, placa, modelo: body.tipoVeiculo || placa, tipo: body.tipoVeiculo || 'CAMINHAO' } });
    const agendamento = await this.prisma.agendamento.create({ data: { protocolo: `RET-${Date.now().toString(36).toUpperCase()}`, status: AgendamentoStatus.ATIVO, data: body.data, horario: body.horario, clienteId: cliente.id, motoristaId: motorista.id, veiculoId: veiculo.id, operacao: body.operacao, subOperacao: body.subOperacao || null, cargaEspecial: body.cargaEspecial ?? false, servicos: Array.isArray(body.servicos) ? body.servicos : [], tipoVeiculo: body.tipoVeiculo || null, cpfMotorista: body.cpfMotorista || null, nomeMotorista: body.nomeMotorista || null, placaVeiculo: placa, transportadora: body.transportadora || null, empresa: body.empresa, diNumero: body.diNumero || null, container: body.container || null, dta: body.dta || null, volumes: body.volumes || null, peso: body.peso || null, consignatario: body.consignatario || null, observacao: body.observacao || null, criadoPorNome: body.criadoPorNome || null, criadoPorRole: 'AURORA_EMPLOYEE', cnpjCliente: body.cnpjCliente || null, enderecoCliente: body.enderecoCliente || null, telefoneCliente: body.telefoneCliente || null, emailCliente: body.emailCliente || null, cnpjTransportadora: body.cnpjTransportadora || null, enderecoTransportadora: body.enderecoTransportadora || null, telefoneTransportadora: body.telefoneTransportadora || null, emailTransportadora: body.emailTransportadora || null }, include: { motorista: true, veiculo: true, cliente: { select: { id: true, nome: true } } } });
    return { protocolo: agendamento.protocolo, id: agendamento.id, agendamento };
  }

  async updateAgendamentoStatus(id: string, status: string, operadorId: string | null = null) {
    if (!Object.values(AgendamentoStatus).includes(status as AgendamentoStatus)) throw new BadRequestException('Status inválido');
    const result = await this.agendamentoStatus.changeStatus({
      agendamentoId: id,
      nextStatus: status as AgendamentoStatus,
      operadorId,
      correlationId: null,
    });
    return result.agendamento;
  }
  listWhatsappAssignments() { return this.prisma.diTransportadoraAtribuicao.findMany({ where: { whatsappNotificadoEm: null, transportadora: { whatsapp: { not: null } } }, include: { transportadora: { select: { nome: true, whatsapp: true } }, diAverbada: { select: { documentoSaida: true, cliente: true } } }, orderBy: { atribuidoEm: 'asc' }, take: 100 }).then((rows) => ({ data: rows.map((a) => ({ id: a.id, nLote: a.nLote, documentoSaida: a.diAverbada?.documentoSaida ?? null, cliente: a.diAverbada?.cliente ?? null, transportadora: a.transportadora.nome, whatsapp: a.transportadora.whatsapp, atribuidoEm: a.atribuidoEm })), total: rows.length })); }
  listWhatsappBookings() { return this.prisma.agendamento.findMany({ where: { notificarWhatsapp: true, whatsappNotificadoEm: null, whatsapp: { not: null } }, select: { id: true, protocolo: true, data: true, horario: true, operacao: true, placaVeiculo: true, transportadora: true, whatsapp: true, nomeMotorista: true, diNumero: true, container: true, empresa: true }, orderBy: { criadoEm: 'asc' }, take: 100 }).then((data) => ({ data, total: data.length })); }

  async createInvite(body: any) { const tipo = body.tipo as UserRole; const inviteTypes: UserRole[] = [UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.TRANSPORTADORA]; if (!inviteTypes.includes(tipo) || !body.nome) throw new BadRequestException('tipo e nome são obrigatórios'); const days = Number(body.diasValidade ?? 36500); const expiresAt = new Date(Date.now() + days * 86400000); const convite = await this.prisma.conviteRegistro.create({ data: { tipo, nome: body.nome, email: body.email || null, codDespachante: body.codDespachante ? String(body.codDespachante) : null, cnpjCliente: body.cnpjCliente || null, cnpjTransportadora: body.cnpjTransportadora ? String(body.cnpjTransportadora).replace(/\D/g, '') : null, codTransp: body.codTransp ? String(body.codTransp) : null, expiresAt } }); const link = `${process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/registro?token=${convite.token}`; if (convite.email) await this.mail.enviar({ para: [convite.email], assunto: 'Convite — Portal do Cliente Aurora EADI', texto: `Acesse ${link} para concluir seu cadastro.`, html: `<p>Olá, ${convite.nome}.</p><p>Acesse <a href="${link}">${link}</a> para concluir seu cadastro.</p>` }); return { id: convite.id, token: convite.token, link, nome: convite.nome, tipo: convite.tipo, expiresAt: convite.expiresAt.toISOString(), emailSent: Boolean(convite.email) }; }
  listInvites() { return this.prisma.conviteRegistro.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).then((data) => ({ data: data.map((c) => ({ ...c, expired: c.expiresAt < new Date(), used: Boolean(c.usedAt) })), total: data.length })); }
  deleteInvite(id: string) { return this.prisma.conviteRegistro.delete({ where: { id } }).then(() => ({ message: 'Convite revogado' })); }
  listUsers(query: any) { const roles = [UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.TRANSPORTADORA]; const role = roles.includes(query.role) ? query.role : { in: roles }; return this.prisma.user.findMany({ where: { role }, include: { cliente: { select: { id: true, nome: true, cnpj: true } }, despachante: { select: { id: true, codDespachante: true, nome: true } }, transportadoraConta: { select: { id: true, cnpj: true, codTransp: true, nome: true } } }, orderBy: { name: 'asc' } }).then((users) => ({ data: users.map((u) => ({ id: u.id, nome: u.name, email: u.email, role: u.role, active: u.active, codDespachante: u.despachante?.codDespachante ?? null, cnpjCliente: u.cliente?.cnpj ?? null, cnpjTransportadora: u.transportadoraConta?.cnpj ?? null, codTransp: u.transportadoraConta?.codTransp ?? null, createdAt: u.createdAt.toISOString() })), total: users.length })); }
  async setUserActive(id: string, active: boolean) { const user = await this.prisma.user.findUnique({ where: { id } }); if (!user) throw new NotFoundException('Usuário não encontrado'); const updated = await this.prisma.user.update({ where: { id }, data: { active } }); return { id: updated.id, nome: updated.name, email: updated.email, role: updated.role, active: updated.active }; }
  listJanelas() { return this.prisma.janelaAtendimento.findMany({ orderBy: { horaInicio: 'asc' } }).then((data) => ({ data })); }
  createJanela(body: any) { if (!body.descricao || !body.horaInicio || !body.horaFim) throw new BadRequestException('descricao, horaInicio e horaFim são obrigatórios'); return this.prisma.janelaAtendimento.create({ data: { descricao: body.descricao, horaInicio: body.horaInicio, horaFim: body.horaFim, intervaloMinutos: body.intervaloMinutos ?? 60, vagasSimultaneas: body.vagasSimultaneas ?? 3 } }); }
  updateJanela(id: string, body: any) { return this.prisma.janelaAtendimento.update({ where: { id }, data: body }); }
  deleteJanela(id: string) { return this.prisma.janelaAtendimento.delete({ where: { id } }).then(() => ({ success: true })); }
  async setBookingWhatsapp(id: string) { const updated = await this.prisma.agendamento.update({ where: { id }, data: { whatsappNotificadoEm: new Date() } }); return { id: updated.id, whatsappNotificadoEm: updated.whatsappNotificadoEm }; }
  async setAssignmentWhatsapp(id: string) { const updated = await this.prisma.diTransportadoraAtribuicao.update({ where: { id }, data: { whatsappNotificadoEm: new Date() } }); return { id: updated.id, whatsappNotificadoEm: updated.whatsappNotificadoEm }; }
  syncTransportadoras(items: any[]) { return Promise.all(items.map(async (item) => { const cnpj = String(item.cnpj_cpf ?? '').replace(/\D/g, ''); const nome = item.nomefantasia ?? item.razaosocial; if (cnpj.length !== 14 || !nome) return 'skipped'; await this.prisma.transportadoraConta.upsert({ where: { cnpj }, create: { cnpj, nome, codTransp: item.cod_transp ? String(item.cod_transp) : null, email: item.emails ?? null, telefone: item.telefones_contato ?? null }, update: { nome, ...(item.cod_transp ? { codTransp: String(item.cod_transp) } : {}) } }); return 'synced'; })).then((results) => ({ synced: results.filter((v) => v === 'synced').length, skipped: results.filter((v) => v === 'skipped').length, failed: 0 })); }
}

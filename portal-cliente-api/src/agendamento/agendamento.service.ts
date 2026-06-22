import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DIStatus, AgendamentoStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

const ACTIVE_STATUSES = [AgendamentoStatus.ATIVO];

@Injectable()
export class AgendamentoService {
  constructor(private prisma: PrismaService) {}

  // ---- CLIENTES ----
  findAllClientes() {
    return this.prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  createCliente(data: { nome: string; cnpj?: string; email?: string; telefone?: string }) {
    return this.prisma.cliente.create({ data });
  }

  updateCliente(id: string, data: Partial<{ nome: string; cnpj: string; email: string; telefone: string; ativo: boolean }>) {
    return this.prisma.cliente.update({ where: { id }, data });
  }

  // ---- DIs ----
  findAllDIs(clienteId?: string) {
    return this.prisma.dI.findMany({
      where: clienteId ? { clienteId } : undefined,
      include: {
        cliente: { select: { id: true, nome: true } },
        agendamentos: {
          where: { status: { in: ACTIVE_STATUSES } },
          select: { id: true, data: true, horario: true, protocolo: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createDI(data: {
    numeroDI: string; clienteId: string; container: string;
    tipoContainer: string; status?: DIStatus; pesoBruto?: number;
    mercadoria: string; transportadora: string;
  }) {
    return this.prisma.dI.create({ data });
  }

  updateDI(id: string, data: Partial<{ status: DIStatus; pesoBruto: number; mercadoria: string }>) {
    return this.prisma.dI.update({ where: { id }, data });
  }

  // ---- MOTORISTAS ----
  findAllMotoristas(clienteId?: string) {
    return this.prisma.motorista.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  createMotorista(data: { clienteId: string; nome: string; cpf: string; cnh: string; telefone: string }) {
    return this.prisma.motorista.create({ data });
  }

  updateMotorista(id: string, data: Partial<{ nome: string; cnh: string; telefone: string; ativo: boolean }>) {
    return this.prisma.motorista.update({ where: { id }, data });
  }

  // ---- VEICULOS ----
  findAllVeiculos(clienteId?: string) {
    return this.prisma.veiculo.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ativo: true },
      orderBy: { placa: 'asc' },
    });
  }

  createVeiculo(data: { clienteId: string; placa: string; modelo: string; tipo: string }) {
    return this.prisma.veiculo.create({ data });
  }

  updateVeiculo(id: string, data: Partial<{ modelo: string; tipo: string; ativo: boolean }>) {
    return this.prisma.veiculo.update({ where: { id }, data });
  }

  // ---- TRANSPORTADORAS ----
  findAllTransportadoras(clienteId?: string) {
    return this.prisma.transportadora.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  createTransportadora(data: { clienteId: string; nome: string; cnpj?: string; telefone?: string }) {
    return this.prisma.transportadora.create({ data });
  }

  updateTransportadora(id: string, data: Partial<{ nome: string; cnpj: string; telefone: string; ativo: boolean }>) {
    return this.prisma.transportadora.update({ where: { id }, data });
  }

  // ---- JANELAS ----
  findAllJanelas() {
    return this.prisma.janelaAtendimento.findMany({ where: { ativo: true }, orderBy: { horaInicio: 'asc' } });
  }

  createJanela(data: { descricao: string; horaInicio: string; horaFim: string; intervaloMinutos?: number; vagasSimultaneas?: number }) {
    return this.prisma.janelaAtendimento.create({ data });
  }

  updateJanela(id: string, data: Partial<{ descricao: string; horaInicio: string; horaFim: string; intervaloMinutos: number; vagasSimultaneas: number; ativo: boolean }>) {
    return this.prisma.janelaAtendimento.update({ where: { id }, data });
  }

  deleteJanela(id: string) {
    return this.prisma.janelaAtendimento.update({ where: { id }, data: { ativo: false } });
  }

  // ---- AGENDAMENTOS ----
  findAllAgendamentos(clienteId?: string) {
    return this.prisma.agendamento.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        ...(clienteId ? { di: { clienteId } } : {}),
      },
      include: {
        di: { include: { cliente: { select: { id: true, nome: true } } } },
        motorista: true,
        veiculo: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findHistorico(clienteId?: string) {
    return this.prisma.agendamento.findMany({
      where: {
        status: AgendamentoStatus.CANCELADO,
        ...(clienteId ? { di: { clienteId } } : {}),
      },
      include: {
        di: { include: { cliente: { select: { id: true, nome: true } } } },
        motorista: true,
        veiculo: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async createAgendamento(data: { diId: string; motoristaId: string; veiculoId: string; data: string; horario: string }) {
    const di = await this.prisma.dI.findUnique({ where: { id: data.diId } });
    if (!di) throw new NotFoundException('DI não encontrada');
    if (di.status !== 'liberada') throw new BadRequestException('DI não está liberada para agendamento');

    const cleanedDate = data.data.replace(/-/g, '');
    const diCode = di.numeroDI.replace(/[^A-Z0-9]/gi, '').slice(2, 8).toUpperCase();
    const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocolo = `FCL-${cleanedDate}-${diCode}-${randomHash}`;

    const agendamento = await this.prisma.agendamento.create({
      data: { ...data, protocolo, status: AgendamentoStatus.ATIVO },
      include: { di: true, motorista: true, veiculo: true },
    });

    await this.prisma.slotReserva.deleteMany({ where: { diId: data.diId } });

    return agendamento;
  }

  cancelarAgendamento(id: string) {
    return this.prisma.agendamento.update({
      where: { id },
      data: { status: AgendamentoStatus.CANCELADO },
    });
  }

  // ---- SLOT RESERVAS (HOLD) ----
  private readonly HOLD_MINUTES = parseInt(process.env.SLOT_HOLD_MINUTES ?? '10', 10);

  async reservarSlot(data: string, horario: string, diId: string, vagasTotais: number) {
    const now = new Date();
    await this.prisma.slotReserva.deleteMany({ where: { diId } });

    const ocupados = await this.contarOcupacao(data, horario);
    if (ocupados >= vagasTotais) throw new ConflictException('Slot sem vagas disponíveis');

    const expiraEm = new Date(now.getTime() + this.HOLD_MINUTES * 60 * 1000);
    return this.prisma.slotReserva.create({ data: { data, horario, diId, expiraEm } });
  }

  async liberarSlot(id: string) {
    await this.prisma.slotReserva.deleteMany({ where: { id } });
  }

  async getDisponibilidade(data: string, horario: string) {
    const ocupados = await this.contarOcupacao(data, horario);
    return { ocupados };
  }

  async verificarHoldDI(diId: string) {
    const hold = await this.prisma.slotReserva.findFirst({
      where: { diId, expiraEm: { gt: new Date() } },
    });
    return { temHold: !!hold };
  }

  private async contarOcupacao(data: string, horario: string): Promise<number> {
    const now = new Date();
    const [bookings, holds] = await Promise.all([
      this.prisma.agendamento.count({ where: { data, horario, status: { in: ACTIVE_STATUSES } } }),
      this.prisma.slotReserva.count({ where: { data, horario, expiraEm: { gt: now } } }),
    ]);
    return bookings + holds;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async limparHoldsExpirados() {
    await this.prisma.slotReserva.deleteMany({ where: { expiraEm: { lt: new Date() } } });
  }
}

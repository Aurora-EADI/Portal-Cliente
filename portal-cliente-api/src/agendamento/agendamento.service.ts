import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DIStatus, AgendamentoStatus } from '@prisma/client';
import type { Prisma, User } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

const ACTIVE_STATUSES = [AgendamentoStatus.ATIVO];

@Injectable()
export class AgendamentoService {
  constructor(private prisma: PrismaService) {}

  async findAtribuicoes(user: Pick<User, 'role' | 'clienteId' | 'despachanteId'>, nLote?: string) {
    let ownership: Prisma.DiAverbadaWhereInput | null = null;
    if (user.role === 'CLIENTE' && user.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: user.clienteId }, select: { cnpj: true },
      });
      if (cliente?.cnpj) ownership = { cnpjCliente: cliente.cnpj };
    } else if (user.role === 'DESPACHANTE' && user.despachanteId) {
      const despachante = await this.prisma.despachante.findUnique({
        where: { id: user.despachanteId }, select: { codDespachante: true },
      });
      if (despachante) ownership = { codDespachante: despachante.codDespachante };
    }
    if (!ownership) return [];

    return this.prisma.diTransportadoraAtribuicao.findMany({
      where: { ...(nLote ? { nLote } : {}), diAverbada: ownership },
      include: { transportadora: { select: { id: true, nome: true, cnpj: true } } },
      orderBy: { atribuidoEm: 'desc' },
    });
  }

  findTransportadorasConta() {
    return this.prisma.transportadoraConta.findMany({
      where: { ativo: true, cnpj: { not: '' } },
      orderBy: { nome: 'asc' },
    });
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

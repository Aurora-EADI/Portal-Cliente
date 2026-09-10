import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DIStatus, AgendamentoStatus } from '@prisma/client';

const ACTIVE_STATUSES = [AgendamentoStatus.ATIVO];

@Injectable()
export class DisService {
  constructor(private prisma: PrismaService) {}

  findAll(clienteId?: string) {
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

  create(data: any) {
    return this.prisma.dI.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.dI.update({ where: { id }, data });
  }
}

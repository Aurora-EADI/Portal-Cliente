import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapDiAverbadaToDI } from './di-averbada.mapper';

@Injectable()
export class DisService {
  constructor(private prisma: PrismaService) {}

  /**
   * DIs do dashboard de agendamento. A fonte é `dis_averbadas` — o que o Portal
   * Aurora averba e sincroniza — mapeada para o shape `DI` do frontend. Antes
   * lia a tabela `dis`, que a integração de averbação nunca alimenta: por isso
   * o dashboard aparecia vazio mesmo com DI averbada.
   */
  async findAll(user: Pick<User, 'role' | 'clienteId' | 'despachanteId'>) {
    const escopo = await this.escopo(user);
    if (escopo === 'nenhum') return [];

    const rows = await this.prisma.diAverbada.findMany({
      where: escopo,
      orderBy: { averbadoEm: 'desc' },
    });
    return rows.map(mapDiAverbadaToDI);
  }

  /**
   * Escopo de visibilidade: cliente vê a própria carga; despachante, a de quem
   * representa; ADMIN/EMPLOYEE, tudo. `'nenhum'` corta a lista para quem não se
   * encaixa — externo sem vínculo não enxerga DI alheia.
   */
  private async escopo(
    user: Pick<User, 'role' | 'clienteId' | 'despachanteId'>,
  ): Promise<Prisma.DiAverbadaWhereInput | undefined | 'nenhum'> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.EMPLOYEE) {
      return undefined;
    }
    if (user.role === UserRole.CLIENTE && user.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: user.clienteId },
        select: { cnpj: true },
      });
      return cliente?.cnpj ? { cnpjCliente: cliente.cnpj } : 'nenhum';
    }
    if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
      const despachante = await this.prisma.despachante.findUnique({
        where: { id: user.despachanteId },
        select: { codDespachante: true },
      });
      return despachante ? { codDespachante: despachante.codDespachante } : 'nenhum';
    }
    return 'nenhum';
  }

  create(data: any) {
    return this.prisma.dI.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.dI.update({ where: { id }, data });
  }
}

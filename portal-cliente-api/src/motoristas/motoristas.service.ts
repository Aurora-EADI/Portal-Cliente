import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MotoristasService {
  constructor(private prisma: PrismaService) {}

  findAll(clienteId?: string) {
    return this.prisma.motorista.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  create(data: any) {
    return this.prisma.motorista.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.motorista.update({ where: { id }, data });
  }
}

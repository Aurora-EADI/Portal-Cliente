import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransportadorasService {
  constructor(private prisma: PrismaService) {}

  findAll(clienteId?: string) {
    return this.prisma.transportadora.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  create(data: any) {
    return this.prisma.transportadora.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.transportadora.update({ where: { id }, data });
  }
}

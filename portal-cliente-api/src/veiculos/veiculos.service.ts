import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VeiculosService {
  constructor(private prisma: PrismaService) {}

  findAll(clienteId?: string) {
    return this.prisma.veiculo.findMany({
      where: { ...(clienteId ? { clienteId } : {}), ativo: true },
      orderBy: { placa: 'asc' },
    });
  }

  create(data: any) {
    return this.prisma.veiculo.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.veiculo.update({ where: { id }, data });
  }
}

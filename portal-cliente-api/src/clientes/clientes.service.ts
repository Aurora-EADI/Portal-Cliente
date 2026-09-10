import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  create(data: any) {
    return this.prisma.cliente.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.cliente.update({ where: { id }, data });
  }
}

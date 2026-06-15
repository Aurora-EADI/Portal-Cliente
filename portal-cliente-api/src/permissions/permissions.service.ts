import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({ orderBy: { category: 'asc' } });
  }

  create(data: { key: string; description: string; category: string }) {
    return this.prisma.permission.create({ data });
  }

  update(id: number, data: Partial<{ key: string; description: string; category: string }>) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.permission.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.module.findMany({
      where: { active: true },
      include: {
        sharedItems: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { userAccess: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.module.findUnique({
      where: { id },
      include: {
        sharedItems: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  create(data: { name: string; description?: string; route?: string; icon?: string; sortOrder?: number }) {
    return this.prisma.module.create({ data });
  }

  update(id: number, data: Partial<{ name: string; description: string; route: string; icon: string; active: boolean; sortOrder: number }>) {
    return this.prisma.module.update({ where: { id }, data });
  }

  async addSharedItem(moduleId: number, item: { targetRoute: string; label: string; icon?: string; sortOrder?: number }) {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');
    return this.prisma.moduleSharedItem.create({ data: { moduleId, ...item } });
  }

  updateSharedItem(itemId: number, data: Partial<{ targetRoute: string; label: string; icon: string; sortOrder: number }>) {
    return this.prisma.moduleSharedItem.update({ where: { id: itemId }, data });
  }

  deleteSharedItem(itemId: number) {
    return this.prisma.moduleSharedItem.delete({ where: { id: itemId } });
  }
}

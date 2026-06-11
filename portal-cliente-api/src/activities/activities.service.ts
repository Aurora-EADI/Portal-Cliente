import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  findAll(moduleId?: number) {
    return this.prisma.activity.findMany({
      where: moduleId ? { moduleId } : undefined,
      include: { permissions: { include: { permission: true } }, module: true },
      orderBy: { id: 'asc' },
    });
  }

  create(data: { name: string; description?: string; moduleId: number; isMandatory?: boolean }) {
    return this.prisma.activity.create({ data, include: { permissions: { include: { permission: true } } } });
  }

  update(id: number, data: Partial<{ name: string; description: string; isMandatory: boolean }>) {
    return this.prisma.activity.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.activity.delete({ where: { id } });
  }

  updatePermissions(activityId: number, permissionIds: number[]) {
    return this.prisma.$transaction([
      this.prisma.activityPermission.deleteMany({ where: { activityId } }),
      this.prisma.activityPermission.createMany({
        data: permissionIds.map((permissionId) => ({ activityId, permissionId })),
      }),
    ]);
  }
}

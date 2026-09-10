import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserModuleAccessService {
  constructor(private prisma: PrismaService) {}

  async getUserModulesWithAccessStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const modules = await this.prisma.module.findMany({
      where: { active: true },
      include: {
        sharedItems: { orderBy: { sortOrder: 'asc' } },
        userAccess: { where: { userId }, take: 1 },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Activities/permissions foram removidas deste portal — a visibilidade e
    // por role + Module.sharedItems. Os campos continuam no payload, sempre
    // vazios, porque o frontend ainda os le (ver a Route Handler equivalente
    // em src/app/api/user-module-access/user/[userId]/modules/route.ts).
    const mappedModules = modules.map((mod) => {
      const access = mod.userAccess[0];

      return {
        id: mod.id,
        name: mod.name,
        description: mod.description ?? '',
        isEnabled: access?.isEnabled ?? false,
        userModuleAccessId: access?.id ?? null,
        activities: [] as never[],
        totalActivities: 0,
        activeActivities: 0,
        route: mod.route,
        icon: mod.icon,
        sharedItems: mod.sharedItems,
      };
    });

    const enabledModules = mappedModules.filter((m) => m.isEnabled).length;

    return {
      user,
      modules: mappedModules,
      summary: {
        totalModules: modules.length,
        enabledModules,
        totalActivities: 0,
        activeActivities: 0,
      },
    };
  }

  async toggleModule(userId: string, moduleId: number, isEnabled: boolean) {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

    const access = await this.prisma.userModuleAccess.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: { userId, moduleId, isEnabled },
      update: { isEnabled },
    });

    return {
      message: `Módulo ${isEnabled ? 'habilitado' : 'desabilitado'} com sucesso`,
      userModuleAccess: { id: access.id, userId, moduleId, moduleName: mod.name, isEnabled },
    };
  }

  async assignMultipleModules(userId: string, updates: { moduleId: number; isEnabled: boolean }[]) {
    const results = await Promise.all(
      updates.map(async (u) => {
        const mod = await this.prisma.module.findUnique({ where: { id: u.moduleId } });
        await this.prisma.userModuleAccess.upsert({
          where: { userId_moduleId: { userId, moduleId: u.moduleId } },
          create: { userId, moduleId: u.moduleId, isEnabled: u.isEnabled },
          update: { isEnabled: u.isEnabled },
        });
        return { moduleId: u.moduleId, moduleName: mod?.name ?? '', isEnabled: u.isEnabled };
      })
    );
    return { message: 'Módulos atualizados', results };
  }

  async removeModuleAccess(userId: string, moduleId: number) {
    await this.prisma.userModuleAccess.updateMany({
      where: { userId, moduleId },
      data: { isEnabled: false },
    });
    return { message: 'Acesso removido' };
  }

  async getModuleUsageStats() {
    const modules = await this.prisma.module.findMany({
      include: { _count: { select: { userAccess: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return modules.map((m) => ({ moduleId: m.id, moduleName: m.name, userCount: m._count.userAccess }));
  }
}

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
        activities: true,
        userAccess: {
          where: { userId },
          take: 1,
          include: {
            activityAccess: { include: { activity: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    let totalActivities = 0;
    let activeActivities = 0;

    const mappedModules = modules.map((mod) => {
      const access = mod.userAccess[0];
      const actMap = new Map((access?.activityAccess ?? []).map((a) => [a.activityId, a.isEnabled]));

      const activities = mod.activities.map((act) => {
        const enabled = act.isMandatory || (actMap.get(act.id) ?? false);
        return {
          id: act.id,
          name: act.name,
          isMandatory: act.isMandatory,
          isActive: enabled,
          permissions: [],
          sortOrder: 0,
        };
      });

      totalActivities += activities.length;
      if (access?.isEnabled) activeActivities += activities.filter((a) => a.isActive).length;

      return {
        id: mod.id,
        name: mod.name,
        description: mod.description ?? '',
        isEnabled: access?.isEnabled ?? false,
        userModuleAccessId: access?.id ?? null,
        activities,
        totalActivities: activities.length,
        activeActivities: activities.filter((a) => a.isActive).length,
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
        totalActivities,
        activeActivities,
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

  async syncMandatoryActivities(moduleId: number) {
    const mod = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { activities: { where: { isMandatory: true } }, userAccess: true },
    });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

    let synced = 0;
    for (const access of mod.userAccess) {
      for (const act of mod.activities) {
        await this.prisma.userActivityAccess.upsert({
          where: { userModuleAccessId_activityId: { userModuleAccessId: access.id, activityId: act.id } },
          create: { userModuleAccessId: access.id, activityId: act.id, isEnabled: true },
          update: { isEnabled: true },
        });
        synced++;
      }
    }
    return { message: 'Sincronizado', synced, module: mod.name };
  }
}

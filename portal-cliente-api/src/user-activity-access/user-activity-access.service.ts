import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserActivityAccessService {
  constructor(private prisma: PrismaService) {}

  async getActivitiesAccess(userId: string, moduleId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

    const moduleAccess = await this.prisma.userModuleAccess.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
      include: {
        activityAccess: { include: { activity: { include: { permissions: { include: { permission: true } } } } } },
      },
    });

    const allActivities = await this.prisma.activity.findMany({
      where: { moduleId },
      include: { permissions: { include: { permission: true } } },
    });

    const actMap = new Map((moduleAccess?.activityAccess ?? []).map((a) => [a.activityId, { isEnabled: a.isEnabled, id: a.id }]));

    const activities = allActivities.map((act) => {
      const actAccess = actMap.get(act.id);
      const isEnabled = act.isMandatory ? true : (actAccess?.isEnabled ?? false);
      return {
        id: act.id,
        name: act.name,
        isMandatory: act.isMandatory,
        isEnabled,
        canToggle: !act.isMandatory,
        permissions: act.permissions.map((ap) => ({
          id: ap.permission.id,
          key: ap.permission.key,
          description: ap.permission.description,
          category: ap.permission.category,
        })),
        userActivityAccessId: actAccess?.id ?? null,
      };
    });

    const summary = {
      totalActivities: activities.length,
      mandatoryActivities: activities.filter((a) => a.isMandatory).length,
      optionalActivities: activities.filter((a) => !a.isMandatory).length,
      enabledActivities: activities.filter((a) => a.isEnabled).length,
    };

    return {
      user,
      module: { id: mod.id, name: mod.name, description: mod.description ?? '' },
      hasModuleAccess: moduleAccess?.isEnabled ?? false,
      userModuleAccessId: moduleAccess?.id ?? undefined,
      activities,
      summary,
    };
  }

  async toggleActivity(userId: string, moduleId: number, activityId: number, isEnabled: boolean) {
    const moduleAccess = await this.prisma.userModuleAccess.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    if (!moduleAccess) throw new NotFoundException('Acesso ao módulo não encontrado. Habilite o módulo primeiro.');

    const activity = await this.prisma.activity.findUnique({ where: { id: activityId }, include: { module: true } });
    if (!activity) throw new NotFoundException('Atividade não encontrada');

    const access = await this.prisma.userActivityAccess.upsert({
      where: { userModuleAccessId_activityId: { userModuleAccessId: moduleAccess.id, activityId } },
      create: { userModuleAccessId: moduleAccess.id, activityId, isEnabled },
      update: { isEnabled },
    });

    return {
      message: `Atividade ${isEnabled ? 'habilitada' : 'desabilitada'}`,
      userActivityAccess: {
        id: access.id,
        activityId,
        activityName: activity.name,
        moduleName: activity.module.name,
        isEnabled: access.isEnabled,
        isMandatory: activity.isMandatory,
      },
    };
  }

  async configureBulkActivities(userId: string, moduleId: number, updates: { activityId: number; isEnabled: boolean }[]) {
    const moduleAccess = await this.prisma.userModuleAccess.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    if (!moduleAccess) throw new NotFoundException('Acesso ao módulo não encontrado');

    const results = await Promise.all(
      updates.map(async (u) => {
        const act = await this.prisma.activity.findUnique({ where: { id: u.activityId } });
        await this.prisma.userActivityAccess.upsert({
          where: { userModuleAccessId_activityId: { userModuleAccessId: moduleAccess.id, activityId: u.activityId } },
          create: { userModuleAccessId: moduleAccess.id, activityId: u.activityId, isEnabled: u.isEnabled },
          update: { isEnabled: u.isEnabled },
        });
        return { activityId: u.activityId, activityName: act?.name ?? '', isEnabled: u.isEnabled, isMandatory: act?.isMandatory ?? false };
      })
    );
    return { message: 'Atividades configuradas', results };
  }

  async removeActivityException(userId: string, moduleId: number, activityId: number) {
    const moduleAccess = await this.prisma.userModuleAccess.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    if (!moduleAccess) throw new NotFoundException('Acesso ao módulo não encontrado');

    const act = await this.prisma.activity.findUnique({ where: { id: activityId }, include: { module: true } });
    await this.prisma.userActivityAccess.deleteMany({ where: { userModuleAccessId: moduleAccess.id, activityId } });

    return {
      message: 'Exceção removida',
      activity: {
        id: activityId,
        name: act?.name ?? '',
        moduleName: act?.module.name ?? '',
        isMandatory: act?.isMandatory ?? false,
        defaultState: act?.isMandatory ?? false,
      },
    };
  }

  async resetModuleActivities(userId: string, moduleId: number) {
    const moduleAccess = await this.prisma.userModuleAccess.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    if (!moduleAccess) throw new NotFoundException('Acesso ao módulo não encontrado');

    const deleted = await this.prisma.userActivityAccess.deleteMany({
      where: { userModuleAccessId: moduleAccess.id },
    });
    return { message: 'Atividades resetadas para padrão', deletedCount: deleted.count };
  }

  async getActivityUsageStats(moduleId?: number) {
    const activities = await this.prisma.activity.findMany({
      where: moduleId ? { moduleId } : undefined,
      include: { module: true, _count: { select: { activityAccess: true } } },
    });
    return activities.map((a) => ({
      activityId: a.id,
      activityName: a.name,
      moduleName: a.module.name,
      userCount: a._count.activityAccess,
    }));
  }
}

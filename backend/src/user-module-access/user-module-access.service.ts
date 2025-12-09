import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaPostgresService as  PrismaService } from '../prisma/prisma.service';
import { ToggleModuleDto } from './dto/toggle-module.dto';
import { BulkAssignModulesDto } from './dto/bulk-assign-modules.dto';

@Injectable()
export class UserModuleAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os módulos com status de acesso do usuário
   * DIFERENTE do users.service - retorna TODOS os módulos com flag de acesso
   */
  async getUserModulesWithAccessStatus(userId: string) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Busca todos os módulos ativos
    const allModules = await this.prisma.module.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        activities: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Busca os acessos do usuário
    const userAccess = await this.prisma.userModuleAccess.findMany({
      where: { userId },
      include: {
        activityAccess: {
          include: {
            activity: true,
          },
        },
      },
    });

    // Mapeia os módulos com status de acesso
    const modulesWithAccess = allModules.map((module) => {
      const access = userAccess.find((ua) => ua.moduleId === module.id);
      const isEnabled = access?.isEnabled ?? false;

      // Mapeia atividades com status de acesso
      const activities = module.activities.map((activity) => {
        const activityAccess = access?.activityAccess.find(
          (aa) => aa.activityId === activity.id,
        );

        // Define se está ativa:
        // - Obrigatórias (isMandatory=true): SEMPRE ativas quando módulo habilitado
        // - Opcionais (isMandatory=false): só ativas se tiver registro explícito com isEnabled=true
        let isActive: boolean;
        if (activity.isMandatory) {
          // Atividades obrigatórias sempre ficam ativas (não podem ser desabilitadas)
          isActive = true;
        } else {
          // Atividades opcionais: só ativas se tiver registro com isEnabled=true
          isActive = activityAccess?.isEnabled ?? false;
        }

        return {
          id: activity.id,
          name: activity.name,
          isMandatory: activity.isMandatory,
          isActive: isEnabled ? isActive : false, // Se módulo desabilitado, todas atividades ficam inativas
          permissions: activity.permissions.map((ap) => ap.permission.key),
        };
      });

      return {
        id: module.id,
        name: module.name,
        description: module.description,
        route: module.route,
        icon: module.icon,
        isEnabled,
        userModuleAccessId: access?.id ?? null,
        activities,
        totalActivities: activities.length,
        activeActivities: activities.filter((a) => a.isActive).length,
      };
    });

    return {
      user,
      modules: modulesWithAccess,
      summary: {
        totalModules: allModules.length,
        enabledModules: modulesWithAccess.filter((m) => m.isEnabled).length,
        totalActivities: modulesWithAccess.reduce(
          (sum, m) => sum + m.totalActivities,
          0,
        ),
        activeActivities: modulesWithAccess.reduce(
          (sum, m) => sum + m.activeActivities,
          0,
        ),
      },
    };
  }

  /**
   * Ativa/Desativa um módulo para o usuário (TOGGLE)
   */
  async toggleModule(
    userId: string,
    moduleId: number,
    toggleDto: ToggleModuleDto,
  ) {
    const { isEnabled } = toggleDto;

    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verifica se o módulo existe e está ativo
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        activities: {
          where: { isMandatory: true },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${moduleId} não encontrado`);
    }

    if (!module.active) {
      throw new BadRequestException(
        `O módulo "${module.name}" está inativo e não pode ser atribuído`,
      );
    }

    // Busca ou cria o acesso ao módulo
    let userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
    });

    if (userModuleAccess) {
      // Atualiza o acesso existente
      userModuleAccess = await this.prisma.userModuleAccess.update({
        where: { id: userModuleAccess.id },
        data: { isEnabled },
      });
    } else {
      // Cria novo acesso
      userModuleAccess = await this.prisma.userModuleAccess.create({
        data: {
          userId,
          moduleId,
          isEnabled,
        },
      });
    }

    // Se está habilitando o módulo, cria automaticamente os acessos às atividades obrigatórias
    if (isEnabled && module.activities.length > 0) {
      const mandatoryActivities = module.activities;

      // Cria acessos apenas para atividades que ainda não têm registro
      const existingAccess = await this.prisma.userActivityAccess.findMany({
        where: {
          userModuleAccessId: userModuleAccess.id,
          activityId: {
            in: mandatoryActivities.map((a) => a.id),
          },
        },
      });

      const existingActivityIds = existingAccess.map((ea) => ea.activityId);
      const newActivities = mandatoryActivities.filter(
        (a) => !existingActivityIds.includes(a.id),
      );

      if (newActivities.length > 0) {
        await this.prisma.userActivityAccess.createMany({
          data: newActivities.map((activity) => ({
            userModuleAccessId: userModuleAccess.id,
            activityId: activity.id,
            isEnabled: true,
          })),
        });
      }
    }

    return {
      message: `Módulo "${module.name}" ${isEnabled ? 'habilitado' : 'desabilitado'} para ${user.name}`,
      userModuleAccess: {
        id: userModuleAccess.id,
        userId: userModuleAccess.userId,
        moduleId: userModuleAccess.moduleId,
        moduleName: module.name,
        isEnabled: userModuleAccess.isEnabled,
      },
    };
  }

  /**
   * Atribui múltiplos módulos de uma vez (bulk)
   */
  async assignMultipleModules(userId: string, bulkDto: BulkAssignModulesDto) {
    const { moduleIds, isEnabled } = bulkDto;

    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verifica se todos os módulos existem e estão ativos
    const modules = await this.prisma.module.findMany({
      where: {
        id: { in: moduleIds },
        active: true,
      },
      include: {
        activities: {
          where: { isMandatory: true },
        },
      },
    });

    if (modules.length !== moduleIds.length) {
      const foundIds = modules.map((m) => m.id);
      const missingIds = moduleIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Módulos não encontrados ou inativos: ${missingIds.join(', ')}`,
      );
    }

    // Processa cada módulo
    const results = await Promise.all(
      modules.map(async (module) => {
        // Busca ou cria o acesso
        let userModuleAccess = await this.prisma.userModuleAccess.findUnique({
          where: {
            userId_moduleId: {
              userId,
              moduleId: module.id,
            },
          },
        });

        if (userModuleAccess) {
          userModuleAccess = await this.prisma.userModuleAccess.update({
            where: { id: userModuleAccess.id },
            data: { isEnabled },
          });
        } else {
          userModuleAccess = await this.prisma.userModuleAccess.create({
            data: {
              userId,
              moduleId: module.id,
              isEnabled,
            },
          });
        }

        // Se habilitando, cria acessos às atividades obrigatórias
        if (isEnabled && module.activities.length > 0) {
          const existingAccess = await this.prisma.userActivityAccess.findMany({
            where: {
              userModuleAccessId: userModuleAccess.id,
              activityId: {
                in: module.activities.map((a) => a.id),
              },
            },
          });

          const existingActivityIds = existingAccess.map((ea) => ea.activityId);
          const newActivities = module.activities.filter(
            (a) => !existingActivityIds.includes(a.id),
          );

          if (newActivities.length > 0) {
            await this.prisma.userActivityAccess.createMany({
              data: newActivities.map((activity) => ({
                userModuleAccessId: userModuleAccess.id,
                activityId: activity.id,
                isEnabled: true,
              })),
            });
          }
        }

        return {
          moduleId: module.id,
          moduleName: module.name,
          isEnabled: userModuleAccess.isEnabled,
        };
      }),
    );

    return {
      message: `${moduleIds.length} módulo(s) ${isEnabled ? 'habilitados' : 'desabilitados'} para ${user.name}`,
      results,
    };
  }

  /**
   * Remove completamente o acesso a um módulo
   */
  async removeModuleAccess(userId: string, moduleId: number) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Busca o acesso
    const userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      include: {
        module: {
          select: { name: true },
        },
      },
    });

    if (!userModuleAccess) {
      throw new NotFoundException(
        `Usuário ${user.name} não possui acesso ao módulo ${moduleId}`,
      );
    }

    // Deleta o acesso (cascata deleta os UserActivityAccess)
    await this.prisma.userModuleAccess.delete({
      where: { id: userModuleAccess.id },
    });

    return {
      message: `Acesso ao módulo "${userModuleAccess.module.name}" removido para ${user.name}`,
    };
  }

  /**
   * Obtém estatísticas de uso dos módulos
   */
  async getModuleUsageStats() {
    const modules = await this.prisma.module.findMany({
      where: { active: true },
      include: {
        userAccess: {
          where: { isEnabled: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        activities: true,
      },
      orderBy: { name: 'asc' },
    });

    return modules.map((module) => ({
      id: module.id,
      name: module.name,
      description: module.description,
      totalActivities: module.activities.length,
      totalUsers: module.userAccess.length,
      users: module.userAccess.map((ua) => ({
        id: ua.user.id,
        name: ua.user.name,
        email: ua.user.email,
      })),
    }));
  }

  /**
   * Sincroniza atividades obrigatórias para usuários que já têm o módulo
   */
  async syncMandatoryActivities(moduleId: number) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        activities: {
          where: { isMandatory: true },
        },
        userAccess: {
          where: { isEnabled: true },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${moduleId} não encontrado`);
    }

    if (module.activities.length === 0) {
      return {
        message: 'Nenhuma atividade obrigatória para sincronizar',
        synced: 0,
      };
    }

    let syncedCount = 0;

    for (const userAccess of module.userAccess) {
      const existingAccess = await this.prisma.userActivityAccess.findMany({
        where: {
          userModuleAccessId: userAccess.id,
          activityId: {
            in: module.activities.map((a) => a.id),
          },
        },
      });

      const existingActivityIds = existingAccess.map((ea) => ea.activityId);
      const newActivities = module.activities.filter(
        (a) => !existingActivityIds.includes(a.id),
      );

      if (newActivities.length > 0) {
        await this.prisma.userActivityAccess.createMany({
          data: newActivities.map((activity) => ({
            userModuleAccessId: userAccess.id,
            activityId: activity.id,
            isEnabled: true,
          })),
        });
        syncedCount += newActivities.length;
      }
    }

    return {
      message: `Sincronizadas ${syncedCount} atividades obrigatórias para ${module.userAccess.length} usuário(s)`,
      synced: syncedCount,
      module: module.name,
    };
  }
}
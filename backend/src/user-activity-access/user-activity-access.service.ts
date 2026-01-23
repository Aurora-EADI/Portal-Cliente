import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaPostgresService as PrismaService } from '../prisma/prisma.service';
import { ToggleActivityDto } from './dto/toggle-activity.dto';
import { BulkConfigureActivitiesDto } from './dto/bulk-configure-activities.dto';

@Injectable()
export class UserActivityAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista atividades do módulo com status de acesso do usuário
   * @param userId - ID do usuário
   * @param moduleId - ID do módulo
   */
  async getActivitiesAccess(userId: string, moduleId: number) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verifica se o módulo existe
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        activities: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${moduleId} não encontrado`);
    }

    // Busca o acesso do usuário ao módulo
    const userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      include: {
        activityAccess: true,
      },
    });

    // Se não tem acesso ao módulo, retorna todas as atividades como desabilitadas
    if (!userModuleAccess || !userModuleAccess.isEnabled) {
      return {
        user,
        module: {
          id: module.id,
          name: module.name,
          description: module.description,
        },
        hasModuleAccess: false,
        message: 'Usuário não tem acesso a este módulo',
        activities: module.activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          isMandatory: activity.isMandatory,
          isEnabled: false,
          canToggle: false,
          permissions: activity.permissions.map((ap) => ap.permission.key),
          userActivityAccessId: null,
        })),
      };
    }

    // Mapeia as atividades com status de acesso
    const activities = module.activities.map((activity) => {
      const activityAccess = userModuleAccess.activityAccess.find(
        (aa) => aa.activityId === activity.id,
      );

      // Define se está habilitada
      let isEnabled = activity.isMandatory; // Obrigatórias sempre habilitadas
      if (activityAccess) {
        isEnabled = activityAccess.isEnabled;
      }

      return {
        id: activity.id,
        name: activity.name,
        isMandatory: activity.isMandatory,
        isEnabled,
        canToggle: !activity.isMandatory, // Só pode alterar se não for obrigatória
        permissions: activity.permissions.map((ap) => ({
          id: ap.permission.id,
          key: ap.permission.key,
          description: ap.permission.description,
          category: ap.permission.category,
        })),
        userActivityAccessId: activityAccess?.id ?? null,
      };
    });

    return {
      user,
      module: {
        id: module.id,
        name: module.name,
        description: module.description,
      },
      hasModuleAccess: true,
      userModuleAccessId: userModuleAccess.id,
      activities,
      summary: {
        totalActivities: activities.length,
        mandatoryActivities: activities.filter((a) => a.isMandatory).length,
        optionalActivities: activities.filter((a) => !a.isMandatory).length,
        enabledActivities: activities.filter((a) => a.isEnabled).length,
      },
    };
  }

  /**
   * Ativa/Desativa uma atividade específica (TOGGLE)
   * Não permite desabilitar atividades obrigatórias
   */
  async toggleActivity(
    userId: string,
    moduleId: number,
    activityId: number,
    toggleDto: ToggleActivityDto,
  ) {
    const { isEnabled } = toggleDto;

    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Busca o acesso ao módulo
    const userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
    });

    if (!userModuleAccess) {
      throw new NotFoundException(
        `Usuário não tem acesso ao módulo ${moduleId}. Atribua o módulo primeiro.`,
      );
    }

    if (!userModuleAccess.isEnabled) {
      throw new BadRequestException(
        `O módulo está desabilitado para este usuário. Habilite o módulo primeiro.`,
      );
    }

    // Verifica se a atividade existe e pertence ao módulo
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        moduleId,
      },
      include: {
        module: {
          select: { name: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(
        `Atividade ${activityId} não encontrada no módulo ${moduleId}`,
      );
    }

    // VALIDAÇÃO CRÍTICA: Não permite desabilitar atividades obrigatórias
    if (activity.isMandatory && !isEnabled) {
      throw new BadRequestException(
        `A atividade "${activity.name}" é obrigatória e não pode ser desabilitada`,
      );
    }

    // Busca ou cria o acesso à atividade
    let userActivityAccess = await this.prisma.userActivityAccess.findUnique({
      where: {
        userModuleAccessId_activityId: {
          userModuleAccessId: userModuleAccess.id,
          activityId,
        },
      },
    });

    if (userActivityAccess) {
      // Atualiza o acesso existente
      userActivityAccess = await this.prisma.userActivityAccess.update({
        where: { id: userActivityAccess.id },
        data: { isEnabled },
      });
    } else {
      // Cria novo acesso
      userActivityAccess = await this.prisma.userActivityAccess.create({
        data: {
          userModuleAccessId: userModuleAccess.id,
          activityId,
          isEnabled,
        },
      });
    }

    return {
      message: `Atividade "${activity.name}" ${isEnabled ? 'habilitada' : 'desabilitada'} para ${user.name} no módulo "${activity.module.name}"`,
      userActivityAccess: {
        id: userActivityAccess.id,
        activityId: userActivityAccess.activityId,
        activityName: activity.name,
        moduleName: activity.module.name,
        isEnabled: userActivityAccess.isEnabled,
        isMandatory: activity.isMandatory,
      },
    };
  }

  /**
   * Configura múltiplas atividades de uma vez (bulk)
   */
  async configureBulkActivities(
    userId: string,
    moduleId: number,
    bulkDto: BulkConfigureActivitiesDto,
  ) {
    const { activities } = bulkDto;

    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Busca o acesso ao módulo
    const userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
    });

    if (!userModuleAccess || !userModuleAccess.isEnabled) {
      throw new BadRequestException(
        `Usuário não tem acesso habilitado ao módulo ${moduleId}`,
      );
    }

    // Busca todas as atividades do módulo
    const activityIds = activities.map((a) => a.activityId);
    const moduleActivities = await this.prisma.activity.findMany({
      where: {
        id: { in: activityIds },
        moduleId,
      },
    });

    if (moduleActivities.length !== activityIds.length) {
      const foundIds = moduleActivities.map((a) => a.id);
      const missingIds = activityIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Atividades não encontradas no módulo: ${missingIds.join(', ')}`,
      );
    }

    // Valida que não está tentando desabilitar atividades obrigatórias
    const invalidAttempts = activities.filter((configActivity) => {
      const activity = moduleActivities.find((a) => a.id === configActivity.activityId);
      return activity?.isMandatory && !configActivity.isEnabled;
    });

    if (invalidAttempts.length > 0) {
      const invalidIds = invalidAttempts.map((a) => a.activityId);
      throw new BadRequestException(
        `As seguintes atividades são obrigatórias e não podem ser desabilitadas: ${invalidIds.join(', ')}`,
      );
    }

    // Processa cada atividade
    const results = await Promise.all(
      activities.map(async (configActivity) => {
        const activity = moduleActivities.find((a) => a.id === configActivity.activityId);

        // Busca ou cria o acesso
        let userActivityAccess = await this.prisma.userActivityAccess.findUnique({
          where: {
            userModuleAccessId_activityId: {
              userModuleAccessId: userModuleAccess.id,
              activityId: configActivity.activityId,
            },
          },
        });

        if (userActivityAccess) {
          userActivityAccess = await this.prisma.userActivityAccess.update({
            where: { id: userActivityAccess.id },
            data: { isEnabled: configActivity.isEnabled },
          });
        } else {
          userActivityAccess = await this.prisma.userActivityAccess.create({
            data: {
              userModuleAccessId: userModuleAccess.id,
              activityId: configActivity.activityId,
              isEnabled: configActivity.isEnabled,
            },
          });
        }

        return {
          activityId: activity?.id,
          activityName: activity?.name,
          isEnabled: userActivityAccess.isEnabled,
          isMandatory: activity?.isMandatory,
        };
      }),
    );

    return {
      message: `${activities.length} atividade(s) configurada(s) para ${user.name}`,
      results,
    };
  }

  /**
   * Remove exceção de uma atividade (volta ao padrão)
   * Se for obrigatória, volta a ficar habilitada
   * Se for opcional, volta a ficar desabilitada
   */
  async removeActivityException(
    userId: string,
    moduleId: number,
    activityId: number,
  ) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Busca o acesso ao módulo
    const userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
    });

    if (!userModuleAccess) {
      throw new NotFoundException(
        `Usuário não tem acesso ao módulo ${moduleId}`,
      );
    }

    // Verifica se a atividade existe
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        moduleId,
      },
      include: {
        module: {
          select: { name: true },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(
        `Atividade ${activityId} não encontrada no módulo ${moduleId}`,
      );
    }

    // Busca a exceção
    const userActivityAccess = await this.prisma.userActivityAccess.findUnique({
      where: {
        userModuleAccessId_activityId: {
          userModuleAccessId: userModuleAccess.id,
          activityId,
        },
      },
    });

    if (!userActivityAccess) {
      throw new NotFoundException(
        `Não existe exceção configurada para esta atividade`,
      );
    }

    // Remove a exceção
    await this.prisma.userActivityAccess.delete({
      where: { id: userActivityAccess.id },
    });

    return {
      message: `Exceção removida. A atividade "${activity.name}" voltou ao padrão ${activity.isMandatory ? '(habilitada - obrigatória)' : '(desabilitada - opcional)'}`,
      activity: {
        id: activity.id,
        name: activity.name,
        moduleName: activity.module.name,
        isMandatory: activity.isMandatory,
        defaultState: activity.isMandatory,
      },
    };
  }

  /**
   * Reseta todas as exceções de um usuário em um módulo
   * Útil para "limpar" configurações customizadas
   */
  async resetModuleActivities(userId: string, moduleId: number) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Busca o acesso ao módulo
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
        `Usuário não tem acesso ao módulo ${moduleId}`,
      );
    }

    // Remove todas as exceções (exceto as obrigatórias)
    const deleted = await this.prisma.userActivityAccess.deleteMany({
      where: {
        userModuleAccessId: userModuleAccess.id,
      },
    });

    return {
      message: `${deleted.count} exceção(ões) removida(s). Atividades do módulo "${userModuleAccess.module.name}" resetadas para o padrão`,
      deletedCount: deleted.count,
    };
  }

  /**
   * Obtém estatísticas de uso de atividades
   * Útil para dashboards administrativos
   */
  async getActivityUsageStats(moduleId?: number) {
    const where = moduleId ? { moduleId } : {};

    const activities = await this.prisma.activity.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        userAccess: {
          where: {
            isEnabled: true,
          },
          include: {
            parentAccess: {
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
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: [{ moduleId: 'asc' }, { name: 'asc' }],
    });

    return activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      moduleId: activity.moduleId,
      moduleName: activity.module.name,
      isMandatory: activity.isMandatory,
      totalUsers: activity.userAccess.length,
      permissions: activity.permissions.map((ap) => ap.permission.key),
      users: activity.userAccess.map((ua) => ({
        id: ua.parentAccess.user.id,
        name: ua.parentAccess.user.name,
        email: ua.parentAccess.user.email,
      })),
    }));
  }
}
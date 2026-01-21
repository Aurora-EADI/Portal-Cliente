import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";
import { UpdateActivityPermissionsDto } from "./dto/update-activity-permissions.dto";

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas as atividades
   * @param moduleId - Filtro opcional por módulo
   */
  async findAll(moduleId?: number) {
    const where = moduleId ? { moduleId } : {};

    const activities = await this.prisma.activity.findMany({
      where,
      orderBy: [{ moduleId: "asc" }, { name: "asc" }],
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                key: true,
                description: true,
                category: true,
              },
            },
          },
        },
        userAccess: {
          select: {
            id: true,
          },
        },
      },
    });

    return activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      moduleId: activity.moduleId,
      moduleName: activity.module.name,
      isMandatory: activity.isMandatory,
      permissions: activity.permissions.map((ap) => ap.permission),
      userAccessCount: activity.userAccess.length,
    }));
  }

  /**
   * Busca uma atividade específica por ID
   */
  async findOne(id: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        userAccess: {
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
      },
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID ${id} não encontrada`);
    }

    return {
      id: activity.id,
      name: activity.name,
      moduleId: activity.moduleId,
      module: activity.module,
      isMandatory: activity.isMandatory,
      permissions: activity.permissions.map((ap) => ap.permission),
      usersWithAccess: activity.userAccess.map((ua) => ({
        id: ua.parentAccess.user.id,
        name: ua.parentAccess.user.name,
        email: ua.parentAccess.user.email,
        isEnabled: ua.isEnabled,
      })),
    };
  }

  /**
   * Cria uma nova atividade e vincula permissões
   */
  async create(createActivityDto: CreateActivityDto) {
    const { name, moduleId, isMandatory, permissionIds } = createActivityDto;

    // Verifica se o módulo existe
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Módulo com ID ${moduleId} não encontrado`);
    }

    // Verifica se já existe atividade com esse nome no módulo (unique constraint)
    const existingActivity = await this.prisma.activity.findUnique({
      where: {
        moduleId_name: {
          moduleId,
          name,
        },
      },
    });

    if (existingActivity) {
      throw new ConflictException(
        `Já existe uma atividade com o nome "${name}" no módulo "${module.name}"`,
      );
    }

    // Verifica se todas as permissões existem
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Permissões não encontradas: ${missingIds.join(", ")}`,
      );
    }

    // Cria a atividade e vincula as permissões
    const activity = await this.prisma.activity.create({
      data: {
        name,
        moduleId,
        isMandatory: isMandatory ?? false,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      message: "Atividade criada com sucesso",
      activity: {
        id: activity.id,
        name: activity.name,
        moduleId: activity.moduleId,
        moduleName: activity.module.name,
        isMandatory: activity.isMandatory,
        permissions: activity.permissions.map((ap) => ap.permission),
      },
    };
  }

  /**
   * Atualiza uma atividade (nome, módulo, isMandatory)
   */
  async update(id: number, updateActivityDto: UpdateActivityDto) {
    // Verifica se a atividade existe
    await this.findOne(id);

    const { name, moduleId, isMandatory } = updateActivityDto;

    // Se está alterando nome ou módulo, verifica constraint unique
    if (name || moduleId) {
      const currentActivity = await this.prisma.activity.findUnique({
        where: { id },
      });

      if (!currentActivity) {
        throw new BadRequestException(
          "Não podem ser indefinidos para validar duplicidade.",
        );
      }

      const targetModuleId = moduleId ?? currentActivity.moduleId;
      const targetName = name ?? currentActivity.name;

      const existingActivity = await this.prisma.activity.findUnique({
        where: {
          moduleId_name: {
            moduleId: targetModuleId,
            name: targetName,
          },
        },
      });

      if (existingActivity && existingActivity.id !== id) {
        throw new ConflictException(
          `Já existe uma atividade com o nome "${targetName}" neste módulo`,
        );
      }
    }

    // Se está alterando o módulo, verifica se ele existe
    if (moduleId) {
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Módulo com ID ${moduleId} não encontrado`);
      }
    }

    const updatedActivity = await this.prisma.activity.update({
      where: { id },
      data: {
        name: name || undefined,
        moduleId: moduleId || undefined,
        isMandatory: isMandatory !== undefined ? isMandatory : undefined,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      message: "Atividade atualizada com sucesso",
      activity: {
        id: updatedActivity.id,
        name: updatedActivity.name,
        moduleId: updatedActivity.moduleId,
        moduleName: updatedActivity.module.name,
        isMandatory: updatedActivity.isMandatory,
        permissions: updatedActivity.permissions.map((ap) => ap.permission),
      },
    };
  }

  /**
   * Atualiza as permissões vinculadas a uma atividade
   * Substitui todas as permissões existentes
   */
  async updatePermissions(
    id: number,
    updatePermissionsDto: UpdateActivityPermissionsDto,
  ) {
    // Verifica se a atividade existe
    await this.findOne(id);

    const { permissionIds } = updatePermissionsDto;

    // Verifica se todas as permissões existem
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Permissões não encontradas: ${missingIds.join(", ")}`,
      );
    }

    // Remove todas as permissões atuais e cria as novas (transação)
    await this.prisma.$transaction([
      // Deleta vínculos antigos
      this.prisma.activityPermission.deleteMany({
        where: { activityId: id },
      }),
      // Cria novos vínculos
      this.prisma.activityPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          activityId: id,
          permissionId,
        })),
      }),
    ]);

    // Busca a atividade atualizada
    const updatedActivity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!updatedActivity) {
      throw new BadRequestException(
        "Não podem ser indefinidos para validar duplicidade.",
      );
    }

    return {
      message: "Permissões atualizadas com sucesso",
      activity: {
        id: updatedActivity.id,
        name: updatedActivity.name,
        permissions: updatedActivity.permissions.map((ap) => ap.permission),
      },
    };
  }

  /**
   * Remove uma atividade
   * Só permite se não houver usuários com acesso
   */
  async remove(id: number) {
    // Verifica se a atividade existe
    await this.findOne(id);

    // Deleta a atividade e seus vínculos em transação
    await this.prisma.$transaction([
      // 1. Remove acessos de usuários (UserActivityAccess)
      this.prisma.userActivityAccess.deleteMany({
        where: { activityId: id },
      }),
      // 2. Remove permissões da atividade (ActivityPermission) - caso não tenha cascade no DB
      this.prisma.activityPermission.deleteMany({
        where: { activityId: id },
      }),
      // 3. Deleta a atividade
      this.prisma.activity.delete({
        where: { id },
      }),
    ]);

    return {
      message: "Atividade deletada com sucesso",
    };
  }

  /**
   * Lista atividades que não têm permissões vinculadas
   * Útil para identificar atividades vazias
   */
  async findWithoutPermissions() {
    const activities = await this.prisma.activity.findMany({
      include: {
        permissions: true,
        module: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const withoutPermissions = activities.filter(
      (a) => a.permissions.length === 0,
    );

    return {
      count: withoutPermissions.length,
      activities: withoutPermissions.map((a) => ({
        id: a.id,
        name: a.name,
        moduleId: a.moduleId,
        moduleName: a.module.name,
        isMandatory: a.isMandatory,
      })),
    };
  }

  /**
   * Lista atividades por categoria de permissão
   */
  async findByPermissionCategory(category: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        permissions: {
          some: {
            permission: {
              category,
            },
          },
        },
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      moduleName: activity.module.name,
      permissions: activity.permissions.map((ap) => ap.permission),
    }));
  }
}

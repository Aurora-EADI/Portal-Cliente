import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaPostgresService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaPostgresService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Busca as permissões requeridas do decorator @RequirePermissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há permissões requeridas, permite acesso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Pega o usuário do request (foi injetado pelo JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Busca as permissões do usuário
    const userPermissions = await this.getUserPermissions(user.id);

    // Verifica se o usuário tem TODAS as permissões necessárias
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Você não tem permissão para acessar este recurso. Permissões necessárias: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Busca todas as permissões que o usuário possui
   * @param userId - ID do usuário
   * @returns Array com as chaves das permissões (ex: ['FAT_VIEW_CUTOFF', 'FAT_EXPORT_CUTOFF'])
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    // Busca todos os acessos a módulos habilitados do usuário
    const userModuleAccess = await this.prisma.userModuleAccess.findMany({
      where: {
        userId,
        isEnabled: true,
      },
      include: {
        activityAccess: {
          where: { isEnabled: true },
          include: {
            activity: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extrai todas as chaves de permissões
    const permissionKeys: string[] = [];

    for (const moduleAccess of userModuleAccess) {
      for (const activityAccess of moduleAccess.activityAccess) {
        for (const activityPermission of activityAccess.activity.permissions) {
          permissionKeys.push(activityPermission.permission.key);
        }
      }
    }

    // Remove duplicatas e retorna
    return [...new Set(permissionKeys)];
  }
}

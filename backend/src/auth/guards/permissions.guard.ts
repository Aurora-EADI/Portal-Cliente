// src/auth/guards/permissions.guard.ts

import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaPostgresService as PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user || !user.id) {
      return false;
    }

    const userPermissions = await this.getUserPermissions(user.id);

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }

  private async getUserPermissions(targetUserId: string): Promise<string[]> {
    const userModules = await this.prisma.userModuleAccess.findMany({
      where: { userId: targetUserId, isEnabled: true },
      include: {
        module: {
          include: {
            activities: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        activityAccess: true,
      },
    });

    if (userModules.length === 0) {
      return [];
    }

    const permissions = new Set<string>();

    for (const modAccess of userModules) {
      for (const activity of modAccess.module.activities) {
        const specificAccess = modAccess.activityAccess.find(
          (a) => a.activityId === activity.id,
        );

        let isActive = activity.isMandatory;
        if (specificAccess) {
          isActive = specificAccess.isEnabled;
        }

        if (isActive) {
          activity.permissions.forEach((ap) => {
            permissions.add(ap.permission.key);
          });
        }
      }
    }

    return Array.from(permissions);
  }
}

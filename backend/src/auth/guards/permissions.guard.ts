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
    console.log("[PERMISSIONS GUARD] canActivate: Inicialização bem-sucedida");

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    console.log(
      "[PERMISSIONS GUARD] Permissões requeridas:",
      requiredPermissions,
    );

    if (!requiredPermissions) {
      console.log(
        "[PERMISSIONS GUARD] Nenhuma permissão requerida, liberando acesso",
      );
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    console.log("[PERMISSIONS GUARD] User no request:", user);
    console.log("[PERMISSIONS GUARD] User.id:", user?.id);

    // MUDANÇA: Usar user.id ao invés de user.sub
    if (!user || !user.id) {
      console.error("[PERMISSIONS GUARD] Usuário não encontrado no request!");
      return false;
    }

    // MUDANÇA: Passar user.id ao invés de user.sub
    const userPermissions = await this.getUserPermissions(user.id);

    console.log("[PERMISSIONS GUARD] Verificando permissões:", {
      required: requiredPermissions,
      user: userPermissions,
    });

    // Verifica se o usuário tem TODAS as permissões exigidas pela rota
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    console.log(
      "[PERMISSIONS GUARD] Resultado:",
      hasPermission ? "PERMITIDO" : "NEGADO",
    );

    return hasPermission;
  }

  // Renomeando o parâmetro de 'userId' para 'targetUserId'
  private async getUserPermissions(targetUserId: string): Promise<string[]> {
    console.log(
      `[PERMISSIONS] Buscando permissões para User ID: ${targetUserId}`,
    );

    // Busca módulos ativos do usuário, incluindo toda a cadeia de permissões
    const userModules = await this.prisma.userModuleAccess.findMany({
      // Usando 'userId' (campo do Prisma) e 'targetUserId' (variável local)
      where: { userId: targetUserId, isEnabled: true },
      include: {
        module: {
          include: {
            activities: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        activityAccess: true, // Traz as exceções (toggles individuais)
      },
    });

    // PASSO CRÍTICO 1: O que o Prisma retornou?
    console.log(`[PERMISSIONS] UserModules encontrados: ${userModules.length}`);

    if (userModules.length === 0) {
      console.error(
        "[PERMISSIONS ERROR] UserModuleAccess está VAZIO! Usuário não tem acesso a módulos.",
      );
      return []; // Retorna zero permissões se o array estiver vazio
    }

    const permissions = new Set<string>();

    for (const modAccess of userModules) {
      console.log(`[PERMISSIONS] Processando módulo: ${modAccess.module.name}`);

      for (const activity of modAccess.module.activities) {
        console.log(
          `[PERMISSIONS] - Atividade: ${activity.name}, isMandatory: ${activity.isMandatory}`,
        );

        const specificAccess = modAccess.activityAccess.find(
          (a) => a.activityId === activity.id,
        );

        let isActive = activity.isMandatory;
        if (specificAccess) {
          isActive = specificAccess.isEnabled;
          console.log(
            `[PERMISSIONS] -- Acesso específico encontrado: isEnabled=${isActive}`,
          );
        }

        if (isActive) {
          // Coleta as chaves técnicas (ex: LOG_VIEW_FLEET)
          activity.permissions.forEach((ap) => {
            permissions.add(ap.permission.key);
            console.log(
              `[PERMISSIONS FOUND] Adicionada chave: ${ap.permission.key}`,
            );
          });
        } else {
          console.log(`[PERMISSIONS] -- Atividade não está ativa, ignorando`);
        }
      }
    }

    const finalPermissions = Array.from(permissions);
    console.log("[PERMISSIONS FINAL] Permissões concedidas:", finalPermissions);

    return finalPermissions;
  }
}

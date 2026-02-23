import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ObtÃ©m os roles requeridos definidos no decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se nÃ£o hÃ¡ roles definidos, permite acesso
    if (!requiredRoles) {
      return true;
    }

    // ObtÃ©m o usuÃ¡rio do request (anexado pelo JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // Verifica se o role do usuÃ¡rio estÃ¡ na lista de roles permitidos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        "VocÃª nÃ£o tem permissÃ£o para acessar este recurso",
      );
    }

    return true;
  }
}


import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client-postgres";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtém os roles requeridos definidos no decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles definidos, permite acesso
    if (!requiredRoles) {
      return true;
    }

    // Obtém o usuário do request (anexado pelo JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // Verifica se o role do usuário está na lista de roles permitidos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        "Você não tem permissão para acessar este recurso",
      );
    }

    return true;
  }
}

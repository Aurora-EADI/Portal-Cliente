import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import type { User } from '@prisma/client';
import { auth } from '../../auth/better-auth';
import { PrismaService } from '../../prisma/prisma.service';

type AuthenticatedRequest = Request & {
  user?: User;
  authSession?: Awaited<ReturnType<typeof auth.api.getSession>>;
};

@Injectable()
export class BetterAuthDomainGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'SESSION_EXPIRED',
        message: 'Sua sessão expirou. Entre novamente.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'SESSION_EXPIRED',
        message: 'Sua sessão expirou. Entre novamente.',
      });
    }

    if (!user.active) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'USER_INACTIVE',
        message: 'Usuário inativo. Entre em contato com o administrador.',
      });
    }

    request.authSession = session;
    request.user = user;
    return true;
  }
}

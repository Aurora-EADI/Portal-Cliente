import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { verifyToken } from './jwt';
import { AUTH_COOKIE } from './auth-cookie';
import type { User, UserRole } from '@prisma/client';

type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

export async function resolveUserFromToken(token: string | null): Promise<AuthSuccess | AuthFailure> {
  if (!token) {
    return { user: null, error: NextResponse.json({ message: 'Token não fornecido' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { user: null, error: NextResponse.json({ message: 'Token inválido' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) {
    return { user: null, error: NextResponse.json({ message: 'Usuário inativo ou não encontrado' }, { status: 401 }) };
  }

  return { user, error: null };
}

/**
 * Cookie httpOnly primeiro; header Bearer como fallback.
 *
 * O fallback existe por dois motivos: sessoes abertas antes da migracao para
 * cookie httpOnly continuam valendo ate expirarem, e clientes nao-browser
 * (Swagger, scripts) nao tem cookie jar. Quando nao houver mais nenhum dos
 * dois, o fallback pode sair.
 */
export function extractToken(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export async function requireAuth(request: NextRequest): Promise<AuthSuccess | AuthFailure> {
  return resolveUserFromToken(extractToken(request));
}

export function requireRoles(user: User, roles: UserRole[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  }
  return null;
}

const EXTERNAL_ROLES: UserRole[] = ['CLIENTE' as UserRole, 'DESPACHANTE' as UserRole, 'TRANSPORTADORA' as UserRole];

export function requireExternalRole(user: User): NextResponse | null {
  if (!EXTERNAL_ROLES.includes(user.role)) {
    return NextResponse.json({ message: 'Acesso restrito a clientes, despachantes e transportadoras' }, { status: 403 });
  }
  return null;
}

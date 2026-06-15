import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase-admin';
import { prisma } from './prisma';
import type { User, UserRole } from '@prisma/client';

type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

export async function requireAuth(request: NextRequest): Promise<AuthSuccess | AuthFailure> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: NextResponse.json({ message: 'Token não fornecido' }, { status: 401 }) };
  }

  const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.admin.getUser(token);
  if (error || !supabaseUser?.email) {
    return { user: null, error: NextResponse.json({ message: 'Token inválido' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({ where: { email: supabaseUser.email } });
  if (!user || !user.active) {
    return { user: null, error: NextResponse.json({ message: 'Usuário inativo ou não encontrado' }, { status: 401 }) };
  }

  return { user, error: null };
}

export function requireRoles(user: User, roles: UserRole[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  }
  return null;
}

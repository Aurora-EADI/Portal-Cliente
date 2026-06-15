import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const janelas = await prisma.janelaAtendimento.findMany({
    where: { ativo: true },
    orderBy: { horaInicio: 'asc' },
  });
  return NextResponse.json(janelas);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, [UserRole.ADMIN]);
  if (denied) return denied;

  const body = await request.json();
  const janela = await prisma.janelaAtendimento.create({ data: body });
  return NextResponse.json(janela, { status: 201 });
}

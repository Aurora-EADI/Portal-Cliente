import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, [UserRole.ADMIN]);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const janela = await prisma.janelaAtendimento.update({ where: { id }, data: body });
  return NextResponse.json(janela);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, [UserRole.ADMIN]);
  if (denied) return denied;

  const { id } = await params;
  await prisma.janelaAtendimento.update({ where: { id }, data: { ativo: false } });
  return NextResponse.json({ ok: true });
}

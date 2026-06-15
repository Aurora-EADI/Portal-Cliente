import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const clienteId = auth.user.role === UserRole.CLIENTE
    ? (auth.user.clienteId ?? undefined)
    : (searchParams.get('clienteId') ?? undefined);

  const motoristas = await prisma.motorista.findMany({
    where: { ...(clienteId ? { clienteId } : {}), ativo: true },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(motoristas);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, STAFF);
  if (denied) return denied;

  const body = await request.json();
  const motorista = await prisma.motorista.create({ data: body });
  return NextResponse.json(motorista, { status: 201 });
}

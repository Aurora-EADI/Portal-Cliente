import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const clienteId = auth.user.role === UserRole.CLIENTE
    ? (auth.user.clienteId ?? undefined)
    : (searchParams.get('clienteId') ?? undefined);

  const dis = await prisma.dI.findMany({
    where: clienteId ? { clienteId } : undefined,
    include: {
      cliente: { select: { id: true, nome: true } },
      agendamentos: {
        where: { status: { in: [AgendamentoStatus.ATIVO] } },
        select: { id: true, data: true, horario: true, protocolo: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(dis);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, STAFF);
  if (denied) return denied;

  const body = await request.json();
  const di = await prisma.dI.create({ data: body });
  return NextResponse.json(di, { status: 201 });
}

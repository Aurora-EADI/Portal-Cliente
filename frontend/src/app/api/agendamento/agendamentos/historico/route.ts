import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const clienteId = auth.user.role === UserRole.CLIENTE
    ? (auth.user.clienteId ?? undefined)
    : (searchParams.get('clienteId') ?? undefined);

  const historico = await prisma.agendamento.findMany({
    where: {
      status: AgendamentoStatus.CANCELADO,
      ...(clienteId ? { di: { clienteId } } : {}),
    },
    include: {
      di: { include: { cliente: { select: { id: true, nome: true } } } },
      motorista: true,
      veiculo: true,
    },
    orderBy: { criadoEm: 'desc' },
  });
  return NextResponse.json(historico);
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);

  let clienteFilter: Record<string, any> = {};

  if (auth.user.role === UserRole.CLIENTE) {
    const cid = auth.user.clienteId;
    if (!cid) return NextResponse.json([]);
    clienteFilter = { di: { clienteId: cid } };
  } else if (auth.user.role === UserRole.DESPACHANTE) {
    if (!auth.user.despachanteId) return NextResponse.json([]);
    const clienteIds = await getDespachanteClienteIds(auth.user.despachanteId);
    if (!clienteIds.length) return NextResponse.json([]);
    clienteFilter = { di: { clienteId: { in: clienteIds } } };
  } else if (auth.user.role === UserRole.TRANSPORTADORA) {
    if (!auth.user.transportadoraContaId) return NextResponse.json([]);
    clienteFilter = { transportadoraContaId: auth.user.transportadoraContaId };
  } else {
    return NextResponse.json([]);
  }

  const historico = await prisma.agendamento.findMany({
    where: {
      status: AgendamentoStatus.CANCELADO,
      ...clienteFilter,
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

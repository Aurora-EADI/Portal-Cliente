import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus, UserRole } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';
import { agendamentoEvents } from '@/lib/events';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.agendamento.findUnique({
    where: { id },
    include: { di: { select: { clienteId: true } } },
  });
  if (!existing) {
    return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
  }

  if (existing.status === AgendamentoStatus.CANCELADO) {
    return NextResponse.json({ message: 'Agendamento já cancelado' }, { status: 400 });
  }

  const agClienteId = existing.di?.clienteId ?? existing.clienteId;

  if (auth.user.role === UserRole.CLIENTE) {
    if (agClienteId && agClienteId !== auth.user.clienteId) {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
    }
  }

  if (auth.user.role === UserRole.TRANSPORTADORA) {
    if (!auth.user.transportadoraContaId || existing.transportadoraContaId !== auth.user.transportadoraContaId) {
      return NextResponse.json({ message: 'Sem permissão para cancelar este agendamento' }, { status: 403 });
    }
  }

  if (auth.user.role === UserRole.DESPACHANTE) {
    if (!auth.user.despachanteId) {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
    }
    if (agClienteId) {
      try {
        const allowedIds = await getDespachanteClienteIds(auth.user.despachanteId);
        if (!allowedIds.includes(agClienteId)) {
          return NextResponse.json({ message: 'Sem permissão para cancelar este agendamento' }, { status: 403 });
        }
      } catch {
        console.error('[cancelar] Erro ao verificar permissões do despachante, permitindo cancelamento');
      }
    }
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { status: AgendamentoStatus.CANCELADO },
  });
  agendamentoEvents.emit('change', agendamento);
  return NextResponse.json(agendamento);
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus, UserRole } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  if (auth.user.role === UserRole.CLIENTE) {
    const existing = await prisma.agendamento.findUnique({
      where: { id },
      include: { di: { select: { clienteId: true } } },
    });
    if (!existing) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }
    if (existing.di?.clienteId !== auth.user.clienteId) {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
    }
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { status: AgendamentoStatus.CANCELADO },
  });
  return NextResponse.json(agendamento);
}

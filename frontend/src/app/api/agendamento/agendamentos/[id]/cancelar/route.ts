import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: { status: AgendamentoStatus.CANCELADO },
  });
  return NextResponse.json(agendamento);
}

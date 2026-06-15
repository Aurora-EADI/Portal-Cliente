import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  const horario = searchParams.get('horario');
  if (!data || !horario) {
    return NextResponse.json({ message: 'data e horario obrigatórios' }, { status: 400 });
  }

  const now = new Date();
  const [bookings, holds] = await Promise.all([
    prisma.agendamento.count({ where: { data, horario, status: { in: [AgendamentoStatus.ATIVO] } } }),
    prisma.slotReserva.count({ where: { data, horario, expiraEm: { gt: now } } }),
  ]);

  return NextResponse.json({ ocupados: bookings + holds });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus } from '@prisma/client';

const HOLD_MINUTES = parseInt(process.env.SLOT_HOLD_MINUTES ?? '10', 10);

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { data, horario, diId, vagasTotais } = await request.json();

  await prisma.slotReserva.deleteMany({ where: { diId } });

  const now = new Date();
  const [bookings, holds] = await Promise.all([
    prisma.agendamento.count({ where: { data, horario, status: { in: [AgendamentoStatus.ATIVO] } } }),
    prisma.slotReserva.count({ where: { data, horario, expiraEm: { gt: now } } }),
  ]);

  if (bookings + holds >= vagasTotais) {
    return NextResponse.json({ message: 'Slot sem vagas disponíveis' }, { status: 409 });
  }

  const expiraEm = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
  const reserva = await prisma.slotReserva.create({ data: { data, horario, diId, expiraEm } });
  return NextResponse.json(reserva, { status: 201 });
}

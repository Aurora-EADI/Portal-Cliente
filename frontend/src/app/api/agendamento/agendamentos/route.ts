import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';

const ACTIVE = [AgendamentoStatus.ATIVO];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const clienteId = auth.user.role === UserRole.CLIENTE
    ? (auth.user.clienteId ?? undefined)
    : (searchParams.get('clienteId') ?? undefined);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: { in: ACTIVE },
      ...(clienteId ? { di: { clienteId } } : {}),
    },
    include: {
      di: { include: { cliente: { select: { id: true, nome: true } } } },
      motorista: true,
      veiculo: true,
    },
    orderBy: { criadoEm: 'desc' },
  });
  return NextResponse.json(agendamentos);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { diId, motoristaId, veiculoId, data, horario } = body;

  const di = await prisma.dI.findUnique({ where: { id: diId } });
  if (!di) return NextResponse.json({ message: 'DI não encontrada' }, { status: 404 });
  if (di.status !== 'liberada') {
    return NextResponse.json({ message: 'DI não está liberada para agendamento' }, { status: 400 });
  }

  const cleanedDate = data.replace(/-/g, '');
  const diCode = di.numeroDI.replace(/[^A-Z0-9]/gi, '').slice(2, 8).toUpperCase();
  const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const protocolo = `FCL-${cleanedDate}-${diCode}-${randomHash}`;

  const agendamento = await prisma.agendamento.create({
    data: { diId, motoristaId, veiculoId, data, horario, protocolo, status: AgendamentoStatus.ATIVO },
    include: { di: true, motorista: true, veiculo: true },
  });

  await prisma.slotReserva.deleteMany({ where: { diId } });

  return NextResponse.json(agendamento, { status: 201 });
}

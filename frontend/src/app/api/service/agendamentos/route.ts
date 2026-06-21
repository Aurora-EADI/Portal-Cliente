import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus } from '@prisma/client';

const SERVICE_KEY = process.env.SERVICE_API_KEY;

function requireServiceKey(request: NextRequest): NextResponse | null {
  if (!SERVICE_KEY) {
    return NextResponse.json({ message: 'Service API not configured' }, { status: 503 });
  }
  const key = request.headers.get('x-service-key');
  if (key !== SERVICE_KEY) {
    return NextResponse.json({ message: 'Invalid service key' }, { status: 401 });
  }
  return null;
}

const ACTIVE_STATUSES = [
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.AG_CHEGADA,
  AgendamentoStatus.CHEGOU,
  AgendamentoStatus.ON_TIME,
  AgendamentoStatus.ATRASADO,
  AgendamentoStatus.CONCLUIDO,
];

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const dataInicio = searchParams.get('dataInicio') ?? undefined;
  const dataFim = searchParams.get('dataFim') ?? undefined;

  const statusFilter = status
    ? { status: status as AgendamentoStatus }
    : { status: { in: ACTIVE_STATUSES } };

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      ...statusFilter,
      ...(clienteId ? {
        OR: [
          { di: { clienteId } },
          { clienteId },
        ],
      } : {}),
      ...(dataInicio && dataFim ? { data: { gte: dataInicio, lte: dataFim } } : {}),
      ...(dataInicio && !dataFim ? { data: { gte: dataInicio } } : {}),
    },
    include: {
      di: { include: { cliente: { select: { id: true, nome: true } } } },
      motorista: true,
      veiculo: true,
      cliente: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
    take: 500,
  });

  return NextResponse.json({
    data: agendamentos,
    total: agendamentos.length,
    timestamp: new Date().toISOString(),
  });
}

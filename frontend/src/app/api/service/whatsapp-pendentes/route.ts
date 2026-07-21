import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const pendentes = await prisma.agendamento.findMany({
    where: {
      notificarWhatsapp: true,
      whatsappNotificadoEm: null,
      whatsapp: { not: null },
    },
    select: {
      id: true,
      protocolo: true,
      data: true,
      horario: true,
      operacao: true,
      placaVeiculo: true,
      transportadora: true,
      whatsapp: true,
      nomeMotorista: true,
      diNumero: true,
      container: true,
      empresa: true,
    },
    orderBy: { criadoEm: 'asc' },
    take: 100,
  });

  return NextResponse.json({ data: pendentes, total: pendentes.length });
}

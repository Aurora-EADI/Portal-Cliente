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

  const janelas = await prisma.janelaAtendimento.findMany({
    orderBy: { horaInicio: 'asc' },
  });

  return NextResponse.json({ data: janelas });
}

export async function POST(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const body = await request.json();
  const { descricao, horaInicio, horaFim, intervaloMinutos, vagasSimultaneas } = body;

  if (!descricao || !horaInicio || !horaFim) {
    return NextResponse.json(
      { message: 'descricao, horaInicio e horaFim são obrigatórios' },
      { status: 400 },
    );
  }

  const janela = await prisma.janelaAtendimento.create({
    data: {
      descricao,
      horaInicio,
      horaFim,
      intervaloMinutos: intervaloMinutos ?? 60,
      vagasSimultaneas: vagasSimultaneas ?? 3,
    },
  });

  return NextResponse.json(janela, { status: 201 });
}

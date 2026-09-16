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

  const pendentes = await prisma.diTransportadoraAtribuicao.findMany({
    where: {
      whatsappNotificadoEm: null,
      transportadora: { whatsapp: { not: null } },
    },
    include: {
      transportadora: { select: { nome: true, whatsapp: true } },
      diAverbada: { select: { documentoSaida: true, cliente: true } },
    },
    orderBy: { atribuidoEm: 'asc' },
    take: 100,
  });

  const data = pendentes.map(a => ({
    id: a.id,
    nLote: a.nLote,
    documentoSaida: a.diAverbada?.documentoSaida ?? null,
    cliente: a.diAverbada?.cliente ?? null,
    transportadora: a.transportadora.nome,
    whatsapp: a.transportadora.whatsapp,
    atribuidoEm: a.atribuidoEm,
  }));

  return NextResponse.json({ data, total: data.length });
}

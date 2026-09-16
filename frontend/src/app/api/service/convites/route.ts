import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createConviteRegistro } from '@/lib/convites';

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

export async function POST(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { tipo, codDespachante, cnpjCliente, cnpjTransportadora, codTransp, nome, email, diasValidade } = body;

    if (!tipo || !nome) {
      return NextResponse.json({ message: 'tipo and nome are required' }, { status: 400 });
    }

    const ALLOWED_TIPOS = ['DESPACHANTE', 'CLIENTE', 'TRANSPORTADORA'];
    if (!ALLOWED_TIPOS.includes(tipo)) {
      return NextResponse.json({ message: `tipo inválido. Permitidos: ${ALLOWED_TIPOS.join(', ')}` }, { status: 400 });
    }

    if (tipo === 'DESPACHANTE' && !codDespachante) {
      return NextResponse.json({ message: 'codDespachante required for DESPACHANTE' }, { status: 400 });
    }

    if (tipo === 'CLIENTE' && !cnpjCliente) {
      return NextResponse.json({ message: 'cnpjCliente required for CLIENTE' }, { status: 400 });
    }

    if (tipo === 'TRANSPORTADORA' && !cnpjTransportadora) {
      return NextResponse.json({ message: 'cnpjTransportadora required for TRANSPORTADORA' }, { status: 400 });
    }

    const { convite, link, emailSent } = await createConviteRegistro({
      tipo: tipo as UserRole,
      nome,
      email,
      diasValidade,
      codDespachante,
      cnpjCliente,
      cnpjTransportadora,
      codTransp,
    });

    return NextResponse.json({
      id: convite.id,
      token: convite.token,
      link,
      nome: convite.nome,
      tipo: convite.tipo,
      expiresAt: convite.expiresAt.toISOString(),
      emailSent,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[service/convites] POST error:', error.message);
    return NextResponse.json({ message: 'Failed to create invite' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const convites = await prisma.conviteRegistro.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    data: convites.map(c => ({
      ...c,
      expired: c.expiresAt < new Date(),
      used: !!c.usedAt,
    })),
    total: convites.length,
  });
}

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { id } = await params;

  const atribuicao = await prisma.diTransportadoraAtribuicao.findUnique({ where: { id } });
  if (!atribuicao) {
    return NextResponse.json({ message: 'Atribuição não encontrada' }, { status: 404 });
  }

  const updated = await prisma.diTransportadoraAtribuicao.update({
    where: { id },
    data: { whatsappNotificadoEm: new Date() },
  });

  return NextResponse.json({ id: updated.id, whatsappNotificadoEm: updated.whatsappNotificadoEm });
}

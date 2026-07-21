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

  const agendamento = await prisma.agendamento.findUnique({ where: { id } });
  if (!agendamento) {
    return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
  }

  const updated = await prisma.agendamento.update({
    where: { id },
    data: { whatsappNotificadoEm: new Date() },
  });

  return NextResponse.json({ id: updated.id, whatsappNotificadoEm: updated.whatsappNotificadoEm });
}

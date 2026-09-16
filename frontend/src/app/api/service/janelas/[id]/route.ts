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
  const body = await request.json();

  const existing = await prisma.janelaAtendimento.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'Janela não encontrada' }, { status: 404 });
  }

  const updated = await prisma.janelaAtendimento.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { id } = await params;

  const existing = await prisma.janelaAtendimento.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: 'Janela não encontrada' }, { status: 404 });
  }

  await prisma.janelaAtendimento.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

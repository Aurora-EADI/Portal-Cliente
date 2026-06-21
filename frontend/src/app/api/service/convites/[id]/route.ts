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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { id } = await params;

  const convite = await prisma.conviteRegistro.findUnique({ where: { id } });
  if (!convite) {
    return NextResponse.json({ message: 'Convite não encontrado' }, { status: 404 });
  }

  if (convite.usedAt) {
    return NextResponse.json({ message: 'Convite já utilizado, não pode ser revogado' }, { status: 400 });
  }

  await prisma.conviteRegistro.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

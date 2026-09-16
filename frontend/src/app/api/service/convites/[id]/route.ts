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

  try {
    await prisma.conviteRegistro.delete({ where: { id } });
    return NextResponse.json({ message: 'Convite revogado' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Convite não encontrado' }, { status: 404 });
    }
    console.error('[service/convites/:id] DELETE error:', error.message);
    return NextResponse.json({ message: 'Failed to revoke convite' }, { status: 500 });
  }
}

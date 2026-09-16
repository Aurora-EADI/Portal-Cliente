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
  { params }: { params: Promise<{ nLote: string }> },
) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { nLote } = await params;
  const decoded = decodeURIComponent(nLote);

  try {
    await prisma.diAverbada.delete({ where: { nLote: decoded } });
    return NextResponse.json({ message: 'DI averbada removed', nLote: decoded });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'DI not found', nLote: decoded }, { status: 404 });
    }
    console.error('[service/dis-averbadas] DELETE error:', error.message);
    return NextResponse.json({ message: 'Failed to remove DI averbada' }, { status: 500 });
  }
}

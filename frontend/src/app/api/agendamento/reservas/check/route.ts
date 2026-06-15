import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const diId = searchParams.get('diId');
  if (!diId) return NextResponse.json({ message: 'diId obrigatório' }, { status: 400 });

  const hold = await prisma.slotReserva.findFirst({
    where: { diId, expiraEm: { gt: new Date() } },
  });
  return NextResponse.json({ temHold: !!hold });
}

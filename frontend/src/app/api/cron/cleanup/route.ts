import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const result = await (prisma as any).slotReserva?.deleteMany({
    where: { expiraEm: { lt: new Date() } },
  });

  return NextResponse.json({ deleted: result?.count ?? 0 });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        cliente: { select: { id: true, nome: true, cnpj: true } },
        despachante: { select: { id: true, codDespachante: true, nome: true } },
      },
    });

    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

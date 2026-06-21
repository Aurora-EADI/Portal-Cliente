import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const convite = await prisma.conviteRegistro.findUnique({
    where: { token },
  });

  if (!convite) {
    return NextResponse.json({ message: 'Convite não encontrado' }, { status: 404 });
  }

  if (convite.usedAt) {
    return NextResponse.json({ message: 'Este convite já foi utilizado' }, { status: 410 });
  }

  if (convite.expiresAt < new Date()) {
    return NextResponse.json({ message: 'Este convite expirou' }, { status: 410 });
  }

  return NextResponse.json({
    token: convite.token,
    tipo: convite.tipo,
    nome: convite.nome,
    email: convite.email,
  });
}

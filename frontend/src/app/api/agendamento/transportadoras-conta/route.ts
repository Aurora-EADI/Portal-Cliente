import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireExternalRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireExternalRole(auth.user);
  if (denied) return denied;

  const transportadoras = await prisma.transportadoraConta.findMany({
    where: { ativo: true, cnpj: { not: '' } },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(transportadoras);
}

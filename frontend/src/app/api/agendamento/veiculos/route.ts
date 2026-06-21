import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles, requireExternalRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireExternalRole(auth.user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);

  let clienteFilter: { clienteId?: string } | { clienteId?: { in: string[] } } | undefined;

  if (auth.user.role === UserRole.CLIENTE) {
    clienteFilter = auth.user.clienteId ? { clienteId: auth.user.clienteId } : undefined;
  } else if (auth.user.role === UserRole.DESPACHANTE) {
    if (!auth.user.despachanteId) return NextResponse.json([]);
    const clienteIds = await getDespachanteClienteIds(auth.user.despachanteId);
    if (!clienteIds.length) return NextResponse.json([]);
    const qClienteId = searchParams.get('clienteId');
    if (qClienteId && clienteIds.includes(qClienteId)) {
      clienteFilter = { clienteId: qClienteId };
    } else {
      clienteFilter = { clienteId: { in: clienteIds } };
    }
  } else {
    return NextResponse.json([]);
  }

  const veiculos = await prisma.veiculo.findMany({
    where: { ...clienteFilter, ativo: true },
    orderBy: { placa: 'asc' },
  });
  return NextResponse.json(veiculos);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { placa, modelo, tipo, clienteId: bodyClienteId } = body;

  if (!placa || !modelo) {
    return NextResponse.json({ message: 'Placa e modelo obrigatórios' }, { status: 400 });
  }

  let effectiveClienteId: string | null = null;

  if (auth.user.role === UserRole.CLIENTE) {
    effectiveClienteId = auth.user.clienteId;
  } else if (auth.user.role === UserRole.DESPACHANTE) {
    if (!bodyClienteId || !auth.user.despachanteId) {
      return NextResponse.json({ message: 'clienteId obrigatório para despachante' }, { status: 400 });
    }
    const allowedIds = await getDespachanteClienteIds(auth.user.despachanteId);
    if (!allowedIds.includes(bodyClienteId)) {
      return NextResponse.json({ message: 'Sem permissão para este cliente' }, { status: 403 });
    }
    effectiveClienteId = bodyClienteId;
  } else {
    return NextResponse.json({ message: 'Acesso restrito' }, { status: 403 });
  }

  if (!effectiveClienteId) {
    return NextResponse.json({ message: 'clienteId não identificado' }, { status: 400 });
  }

  const placaClean = placa.replace(/\s/g, '').toUpperCase();
  const existing = await prisma.veiculo.findFirst({
    where: { clienteId: effectiveClienteId, placa: { contains: placaClean, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const veiculo = await prisma.veiculo.create({
    data: { placa: placaClean, modelo, tipo: tipo || modelo, clienteId: effectiveClienteId },
  });
  return NextResponse.json(veiculo, { status: 201 });
}

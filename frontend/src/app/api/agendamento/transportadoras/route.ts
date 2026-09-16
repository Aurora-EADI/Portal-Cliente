import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireExternalRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireExternalRole(auth.user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);

  let clienteFilter: any;

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

  const transportadoras = await prisma.transportadora.findMany({
    where: { ...clienteFilter, ativo: true },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(transportadoras);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { nome, cnpj, telefone, clienteId: bodyClienteId } = body;

  if (!nome) {
    return NextResponse.json({ message: 'Nome obrigatório' }, { status: 400 });
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

  const existing = await prisma.transportadora.findFirst({
    where: { clienteId: effectiveClienteId, nome: { equals: nome, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const transportadora = await prisma.transportadora.create({
    data: { nome, cnpj: cnpj || null, telefone: telefone || null, clienteId: effectiveClienteId },
  });
  return NextResponse.json(transportadora, { status: 201 });
}

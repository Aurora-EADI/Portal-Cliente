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

  let scopeFilter: { clienteId?: string | { in: string[] }; transportadoraContaId?: string } | undefined;

  if (auth.user.role === UserRole.CLIENTE) {
    scopeFilter = auth.user.clienteId ? { clienteId: auth.user.clienteId } : undefined;
  } else if (auth.user.role === UserRole.DESPACHANTE) {
    if (!auth.user.despachanteId) return NextResponse.json([]);
    const clienteIds = await getDespachanteClienteIds(auth.user.despachanteId);
    if (!clienteIds.length) return NextResponse.json([]);
    const qClienteId = searchParams.get('clienteId');
    if (qClienteId && clienteIds.includes(qClienteId)) {
      scopeFilter = { clienteId: qClienteId };
    } else {
      scopeFilter = { clienteId: { in: clienteIds } };
    }
  } else if (auth.user.role === UserRole.TRANSPORTADORA) {
    if (!auth.user.transportadoraContaId) return NextResponse.json([]);
    scopeFilter = { transportadoraContaId: auth.user.transportadoraContaId };
  } else {
    return NextResponse.json([]);
  }

  const motoristas = await prisma.motorista.findMany({
    where: { ...scopeFilter, ativo: true },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(motoristas);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { nome, cpf, cnh, telefone, clienteId: bodyClienteId } = body;

  if (!nome || !cpf) {
    return NextResponse.json({ message: 'Nome e CPF obrigatórios' }, { status: 400 });
  }

  let effectiveClienteId: string | null = null;
  let effectiveTransportadoraContaId: string | null = null;

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
  } else if (auth.user.role === UserRole.TRANSPORTADORA) {
    if (!auth.user.transportadoraContaId) {
      return NextResponse.json({ message: 'Conta de transportadora não identificada' }, { status: 400 });
    }
    effectiveTransportadoraContaId = auth.user.transportadoraContaId;
  } else {
    return NextResponse.json({ message: 'Acesso restrito' }, { status: 403 });
  }

  if (!effectiveClienteId && !effectiveTransportadoraContaId) {
    return NextResponse.json({ message: 'clienteId não identificado' }, { status: 400 });
  }

  const cpfClean = cpf.replace(/\D/g, '');
  const scopeWhere = effectiveTransportadoraContaId
    ? { transportadoraContaId: effectiveTransportadoraContaId }
    : { clienteId: effectiveClienteId };
  const existing = await prisma.motorista.findFirst({
    where: { ...scopeWhere, cpf: { contains: cpfClean } },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const motorista = await prisma.motorista.create({
    data: { nome, cpf, cnh: cnh || '', telefone: telefone || '', clienteId: effectiveClienteId, transportadoraContaId: effectiveTransportadoraContaId },
  });
  return NextResponse.json(motorista, { status: 201 });
}

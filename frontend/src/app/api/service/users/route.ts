import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') ?? undefined;

  const validRoles = [UserRole.DESPACHANTE, UserRole.CLIENTE] as string[];
  const roleFilter = role && validRoles.includes(role)
    ? { role: role as UserRole }
    : { role: { in: [UserRole.DESPACHANTE, UserRole.CLIENTE] } };

  const users = await prisma.user.findMany({
    where: roleFilter,
    include: {
      cliente: { select: { id: true, nome: true, cnpj: true } },
      despachante: { select: { id: true, codDespachante: true, nome: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Find users that are missing the entity link (clienteId/despachanteId is null)
  const unlinkedIds = users
    .filter(u => !u.clienteId && !u.despachanteId)
    .map(u => u.id);

  // Fallback: recover cnpj/codDespachante from the accepted convite
  const fallbackConvites = unlinkedIds.length > 0
    ? await prisma.conviteRegistro.findMany({
        where: { usedByUserId: { in: unlinkedIds } },
        select: { usedByUserId: true, cnpjCliente: true, codDespachante: true },
      })
    : [];

  const conviteByUserId = new Map(
    fallbackConvites
      .filter(c => c.usedByUserId)
      .map(c => [c.usedByUserId!, c]),
  );

  const mapped = users.map(u => ({
    id: u.id,
    nome: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    codDespachante: u.despachante?.codDespachante ?? conviteByUserId.get(u.id)?.codDespachante ?? null,
    cnpjCliente: u.cliente?.cnpj ?? conviteByUserId.get(u.id)?.cnpjCliente ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return NextResponse.json({ data: mapped, total: mapped.length });
}

export async function PATCH(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const body = await request.json();
  const { userId, codDespachante, cnpjCliente } = body;

  if (!userId) {
    return NextResponse.json({ message: 'userId required' }, { status: 400 });
  }

  const updateData: Record<string, any> = {};

  if (codDespachante) {
    const desp = await prisma.despachante.findUnique({ where: { codDespachante } });
    if (desp) updateData.despachanteId = desp.id;
  }

  if (cnpjCliente) {
    const cli = await prisma.cliente.findFirst({ where: { cnpj: cnpjCliente } });
    if (cli) updateData.clienteId = cli.id;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
  return NextResponse.json({ id: updated.id, despachanteId: updated.despachanteId, clienteId: updated.clienteId });
}

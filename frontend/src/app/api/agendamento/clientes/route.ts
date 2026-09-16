import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, STAFF);
  if (denied) return denied;

  const clientes = await prisma.cliente.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, STAFF);
  if (denied) return denied;

  const body = await request.json();
  const cliente = await prisma.cliente.create({ data: body });
  return NextResponse.json(cliente, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, STAFF);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const cliente = await prisma.cliente.update({ where: { id }, data: body });
  return NextResponse.json(cliente);
}

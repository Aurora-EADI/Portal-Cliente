import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';

const STAFF: UserRole[] = [UserRole.ADMIN, UserRole.EMPLOYEE];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const motorista = await prisma.motorista.findUnique({ where: { id } });
  if (!motorista) return NextResponse.json({ message: 'Motorista não encontrado' }, { status: 404 });

  if (!STAFF.includes(auth.user.role)) {
    let owns = false;
    if (auth.user.role === UserRole.CLIENTE) {
      owns = !!auth.user.clienteId && motorista.clienteId === auth.user.clienteId;
    } else if (auth.user.role === UserRole.DESPACHANTE) {
      if (auth.user.despachanteId) {
        const clienteIds = await getDespachanteClienteIds(auth.user.despachanteId);
        owns = !!motorista.clienteId && clienteIds.includes(motorista.clienteId);
      }
    } else if (auth.user.role === UserRole.TRANSPORTADORA) {
      owns = !!auth.user.transportadoraContaId && motorista.transportadoraContaId === auth.user.transportadoraContaId;
    }
    if (!owns) return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json();
  const data = STAFF.includes(auth.user.role)
    ? body
    : { nome: body.nome, cnh: body.cnh, telefone: body.telefone };

  const updated = await prisma.motorista.update({ where: { id }, data });
  return NextResponse.json(updated);
}

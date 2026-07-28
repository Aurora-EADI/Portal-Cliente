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
  const veiculo = await prisma.veiculo.findUnique({ where: { id } });
  if (!veiculo) return NextResponse.json({ message: 'Veículo não encontrado' }, { status: 404 });

  if (!STAFF.includes(auth.user.role)) {
    let owns = false;
    if (auth.user.role === UserRole.CLIENTE) {
      owns = !!auth.user.clienteId && veiculo.clienteId === auth.user.clienteId;
    } else if (auth.user.role === UserRole.DESPACHANTE) {
      if (auth.user.despachanteId) {
        const clienteIds = await getDespachanteClienteIds(auth.user.despachanteId);
        owns = !!veiculo.clienteId && clienteIds.includes(veiculo.clienteId);
      }
    } else if (auth.user.role === UserRole.TRANSPORTADORA) {
      owns = !!auth.user.transportadoraContaId && veiculo.transportadoraContaId === auth.user.transportadoraContaId;
    }
    if (!owns) return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json();
  const data = STAFF.includes(auth.user.role)
    ? body
    : { modelo: body.modelo, tipo: body.tipo };

  const updated = await prisma.veiculo.update({ where: { id }, data });
  return NextResponse.json(updated);
}

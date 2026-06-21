import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles, requireExternalRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

function mapDisAverbadas(disAverbadas: any[]) {
  return disAverbadas.map(da => ({
    id: da.id,
    numeroDI: da.documentoSaida || da.nLote,
    cliente: da.cliente || '',
    container: da.containers || '',
    tipoContainer: da.tipoDocumento || '',
    status: da.status || 'liberada',
    pesoBruto: da.saldo ?? 0,
    mercadoria: '',
    transportadora: '',
    nLote: da.nLote,
    nConhecimento: da.nConhecimento,
    dta: da.dta,
    modalidade: da.modalidade,
    cnpjCliente: da.cnpjCliente,
    codDespachante: da.codDespachante,
    despachante: da.despachante,
    localizacao: da.localizacao,
    averbadoEm: da.averbadoEm,
    agendamentos: [],
  }));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.role === UserRole.DESPACHANTE) {
    if (!auth.user.despachanteId) {
      return NextResponse.json([], { status: 200 });
    }
    const despachante = await prisma.despachante.findUnique({
      where: { id: auth.user.despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) {
      return NextResponse.json([], { status: 200 });
    }
    const disAverbadas = await prisma.diAverbada.findMany({
      where: { codDespachante: despachante.codDespachante },
      orderBy: { sincronizadoEm: 'desc' },
    });
    return NextResponse.json(mapDisAverbadas(disAverbadas));
  }

  if (auth.user.role === UserRole.CLIENTE) {
    if (!auth.user.clienteId) {
      return NextResponse.json([], { status: 200 });
    }
    const cliente = await prisma.cliente.findUnique({
      where: { id: auth.user.clienteId },
      select: { cnpj: true },
    });
    if (!cliente?.cnpj) {
      return NextResponse.json([], { status: 200 });
    }
    const disAverbadas = await prisma.diAverbada.findMany({
      where: { cnpjCliente: cliente.cnpj },
      orderBy: { sincronizadoEm: 'desc' },
    });
    return NextResponse.json(mapDisAverbadas(disAverbadas));
  }

  return NextResponse.json({ message: 'Acesso restrito a clientes e despachantes' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireRoles(auth.user, STAFF);
  if (denied) return denied;

  const body = await request.json();
  const di = await prisma.dI.create({ data: body });
  return NextResponse.json(di, { status: 201 });
}

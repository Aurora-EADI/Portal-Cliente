import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles, requireExternalRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';

const STAFF = [UserRole.ADMIN, UserRole.EMPLOYEE];

/**
 * Situação da procuração por CNPJ de cliente, para o despachante logado.
 *
 * A DI continua aparecendo na lista mesmo sem procuração — escondê-la deixaria
 * o despachante sem entender por que a carga sumiu. O que muda é a ação: sem
 * procuração APROVADA ele vê a DI, mas não opera em nome daquele importador.
 *
 * `null` = não existe procuração para o par, o que bloqueia igual.
 */
async function statusProcuracaoPorCnpj(
  despachanteId: string,
  cnpjs: string[],
): Promise<Record<string, string | null>> {
  if (!cnpjs.length) return {};

  const clientes = await prisma.cliente.findMany({
    where: { cnpj: { in: cnpjs } },
    select: { id: true, cnpj: true },
  });
  if (!clientes.length) return {};

  const procuracoes = await prisma.procuracao.findMany({
    where: { despachanteId, clienteId: { in: clientes.map(c => c.id) } },
    select: { clienteId: true, status: true },
  });

  const statusPorCliente = new Map(procuracoes.map(p => [p.clienteId, p.status as string]));

  return Object.fromEntries(
    clientes
      .filter((c): c is { id: string; cnpj: string } => Boolean(c.cnpj))
      .map(c => [c.cnpj, statusPorCliente.get(c.id) ?? null]),
  );
}

function mapDisAverbadas(
  disAverbadas: any[],
  procuracaoPorCnpj?: Record<string, string | null>,
) {
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
    // Só o despachante recebe isto; para os demais fica undefined e a tela
    // não muda em nada.
    procuracaoStatus: procuracaoPorCnpj
      ? (da.cnpjCliente ? procuracaoPorCnpj[da.cnpjCliente] ?? null : null)
      : undefined,
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

    const cnpjs = Array.from(
      new Set(
        disAverbadas
          .map(da => da.cnpjCliente)
          .filter((c): c is string => Boolean(c)),
      ),
    );
    const procuracaoPorCnpj = await statusProcuracaoPorCnpj(
      auth.user.despachanteId,
      cnpjs,
    );

    return NextResponse.json(mapDisAverbadas(disAverbadas, procuracaoPorCnpj));
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

  if (auth.user.role === UserRole.TRANSPORTADORA) {
    if (!auth.user.transportadoraContaId) {
      return NextResponse.json([], { status: 200 });
    }
    const disAverbadas = await prisma.diAverbada.findMany({
      where: { atribuicoes: { some: { transportadoraContaId: auth.user.transportadoraContaId } } },
      include: {
        atribuicoes: { where: { transportadoraContaId: auth.user.transportadoraContaId }, select: { container: true } },
      },
      orderBy: { sincronizadoEm: 'desc' },
    });
    // Atribuição por container específico: só mostra os containers atribuídos,
    // não a DI inteira. Atribuição legada ("" = DI inteira) continua mostrando tudo.
    const comContainersRestritos = disAverbadas.map(da => {
      const temDiInteira = da.atribuicoes.some(a => a.container === '');
      const containersAtribuidos = da.atribuicoes.map(a => a.container).filter(Boolean);
      return {
        ...da,
        containers: temDiInteira || containersAtribuidos.length === 0 ? da.containers : containersAtribuidos.join(' / '),
      };
    });
    return NextResponse.json(mapDisAverbadas(comContainersRestritos));
  }

  return NextResponse.json({ message: 'Acesso restrito a clientes, despachantes e transportadoras' }, { status: 403 });
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

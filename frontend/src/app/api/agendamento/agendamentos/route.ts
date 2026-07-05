import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireExternalRole } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { UserRole, AgendamentoStatus } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';

const ACTIVE_STATUSES = [
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.AG_CHEGADA,
  AgendamentoStatus.CHEGOU,
  AgendamentoStatus.ON_TIME,
  AgendamentoStatus.ATRASADO,
];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const denied = requireExternalRole(auth.user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);

  let clienteFilter: Record<string, any> = {};

  if (auth.user.role === UserRole.CLIENTE) {
    const cid = auth.user.clienteId;
    if (!cid) return NextResponse.json([]);
    clienteFilter = { OR: [{ di: { clienteId: cid } }, { clienteId: cid }] };
  } else if (auth.user.role === UserRole.DESPACHANTE) {
    if (!auth.user.despachanteId) return NextResponse.json([]);
    const clienteIds = await getDespachanteClienteIds(auth.user.despachanteId);
    if (!clienteIds.length) return NextResponse.json([]);
    const qClienteId = searchParams.get('clienteId');
    if (qClienteId && clienteIds.includes(qClienteId)) {
      clienteFilter = { OR: [{ di: { clienteId: qClienteId } }, { clienteId: qClienteId }] };
    } else {
      clienteFilter = { OR: [{ di: { clienteId: { in: clienteIds } } }, { clienteId: { in: clienteIds } }] };
    }
  } else if (auth.user.role === UserRole.TRANSPORTADORA) {
    if (!auth.user.transportadoraContaId) return NextResponse.json([]);
    clienteFilter = { transportadoraContaId: auth.user.transportadoraContaId };
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      ...clienteFilter,
    },
    include: {
      di: { include: { cliente: { select: { id: true, nome: true } } } },
      motorista: true,
      veiculo: true,
      cliente: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });
  return NextResponse.json(agendamentos);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (body.diId) {
      if (auth.user.role === UserRole.TRANSPORTADORA) {
        return NextResponse.json({ message: 'Fluxo não disponível para transportadoras' }, { status: 403 });
      }
      return handleLegacyPost(body, auth.user);
    }

    return handleNewFormPost(body, auth.user);
  } catch (error: any) {
    console.error('[POST /agendamento/agendamentos]', error);
    const msg = error?.meta?.cause ?? error?.message ?? 'Erro ao criar agendamento';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

async function handleLegacyPost(body: any, user: any) {
  const { diId, motoristaId, veiculoId, data, horario } = body;

  const existingLegacy = await prisma.agendamento.findFirst({
    where: { data, horario, motoristaId, status: { not: AgendamentoStatus.CANCELADO } },
  });
  if (existingLegacy) {
    return NextResponse.json({ message: 'Já existe um agendamento para este motorista nesta data e horário.' }, { status: 409 });
  }

  const di = await prisma.dI.findUnique({ where: { id: diId } });
  if (!di) return NextResponse.json({ message: 'DI não encontrada' }, { status: 404 });
  if (di.status !== 'liberada') {
    return NextResponse.json({ message: 'DI não está liberada para agendamento' }, { status: 400 });
  }

  if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
    const allowedIds = await getDespachanteClienteIds(user.despachanteId);
    if (!allowedIds.includes(di.clienteId)) {
      return NextResponse.json({ message: 'Sem permissão para agendar esta DI' }, { status: 403 });
    }
  }

  const cleanedDate = data.replace(/-/g, '');
  const diCode = di.numeroDI.replace(/[^A-Z0-9]/gi, '').slice(2, 8).toUpperCase();
  const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const protocolo = `FCL-${cleanedDate}-${diCode}-${randomHash}`;

  const agendamento = await prisma.agendamento.create({
    data: { diId, motoristaId, veiculoId, data, horario, protocolo, status: AgendamentoStatus.ATIVO, criadoPorNome: user.name || null, criadoPorRole: user.role || null },
    include: { di: true, motorista: true, veiculo: true },
  });

  return NextResponse.json(agendamento, { status: 201 });
}

async function handleNewFormPost(body: any, user: any) {
  const {
    operacao, subOperacao, cargaEspecial, servicos,
    tipoVeiculo, dataAgendamento, inicio,
    cpfMotorista, nomeMotorista, transportadora, empresa,
    awbMawb, di: diNumero, dta, hawb, numeroVoo,
    placaVeiculo, volumes, peso, consignatario, observacoes,
    container,
  } = body;

  if (cpfMotorista && dataAgendamento && inicio) {
    const cpfCleanCheck = cpfMotorista.replace(/\D/g, '');
    const sameDateTimeBookings = await prisma.agendamento.findMany({
      where: {
        data: dataAgendamento,
        horario: inicio,
        status: { not: AgendamentoStatus.CANCELADO },
      },
    });
    const duplicate = sameDateTimeBookings.find(b => b.cpfMotorista?.replace(/\D/g, '') === cpfCleanCheck);
    if (duplicate) {
      return NextResponse.json(
        { message: 'Já existe um agendamento para este motorista nesta data e horário.' },
        { status: 409 },
      );
    }
  }

  let clienteId: string | null = null;
  let transportadoraContaId: string | null = null;
  let transportadoraNome: string | null = null;

  if (user.role === UserRole.TRANSPORTADORA) {
    if (!user.transportadoraContaId) {
      return NextResponse.json({ message: 'Conta de transportadora não vinculada' }, { status: 403 });
    }
    const diNumeros: string[] = (Array.isArray(diNumero) ? diNumero : diNumero ? [diNumero] : [])
      .map((d: string) => String(d).trim())
      .filter(Boolean);
    if (diNumeros.length === 0) {
      return NextResponse.json({ message: 'Informe a DI para agendar' }, { status: 400 });
    }

    // Só DIs atribuídas a esta transportadora podem ser agendadas
    const disAtribuidas = await prisma.diAverbada.findMany({
      where: {
        OR: [{ documentoSaida: { in: diNumeros } }, { nLote: { in: diNumeros } }],
        atribuicoes: { some: { transportadoraContaId: user.transportadoraContaId } },
      },
    });
    const encontrados = new Set(disAtribuidas.flatMap(d => [d.documentoSaida, d.nLote].filter(Boolean)));
    const semAtribuicao = diNumeros.filter(n => !encontrados.has(n));
    if (semAtribuicao.length > 0) {
      return NextResponse.json(
        { message: `DI(s) não atribuída(s) a esta transportadora: ${semAtribuicao.join(', ')}` },
        { status: 403 },
      );
    }

    transportadoraContaId = user.transportadoraContaId;
    const conta = await prisma.transportadoraConta.findUnique({
      where: { id: user.transportadoraContaId },
      select: { nome: true },
    });
    transportadoraNome = conta?.nome ?? null;

    const cnpjClienteDi = disAtribuidas.find(d => d.cnpjCliente)?.cnpjCliente;
    if (cnpjClienteDi) {
      const cliente = await prisma.cliente.findFirst({ where: { cnpj: cnpjClienteDi } });
      clienteId = cliente?.id ?? null;
    }
  } else if (user.role === UserRole.CLIENTE && user.clienteId) {
    clienteId = user.clienteId;
  } else if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
    if (empresa) {
      const cliente = await prisma.cliente.findFirst({ where: { nome: { contains: empresa, mode: 'insensitive' } } });
      if (cliente) {
        const allowedIds = await getDespachanteClienteIds(user.despachanteId);
        if (!allowedIds.includes(cliente.id)) {
          return NextResponse.json({ message: 'Sem permissão para agendar para este cliente' }, { status: 403 });
        }
        clienteId = cliente.id;
      }
    }
  } else if (empresa) {
    const cliente = await prisma.cliente.findFirst({ where: { nome: { contains: empresa, mode: 'insensitive' } } });
    clienteId = cliente?.id ?? null;
  }

  let motoristaId: string | null = null;
  if (cpfMotorista && clienteId) {
    const cpfClean = cpfMotorista.replace(/\D/g, '');
    const allMotoristas = await prisma.motorista.findMany({ where: { clienteId } });
    let motorista = allMotoristas.find(m => m.cpf.replace(/\D/g, '') === cpfClean) ?? null;
    if (!motorista && nomeMotorista) {
      motorista = await prisma.motorista.create({
        data: { clienteId, nome: nomeMotorista, cpf: cpfMotorista, cnh: '', telefone: '' },
      });
    }
    motoristaId = motorista?.id ?? null;
  }

  let veiculoId: string | null = null;
  if (placaVeiculo && clienteId) {
    const placaClean = placaVeiculo.replace(/\s/g, '').toUpperCase();
    let veiculo = await prisma.veiculo.findFirst({
      where: { clienteId, placa: { contains: placaClean, mode: 'insensitive' } },
    });
    if (!veiculo && tipoVeiculo) {
      veiculo = await prisma.veiculo.create({
        data: { clienteId, placa: placaVeiculo.toUpperCase(), modelo: tipoVeiculo, tipo: tipoVeiculo },
      });
    }
    veiculoId = veiculo?.id ?? null;
  }

  const protocolo = `AG-${Date.now().toString(36).toUpperCase()}`;

  const agendamento = await prisma.agendamento.create({
    data: {
      protocolo,
      status: AgendamentoStatus.ATIVO,
      data: dataAgendamento,
      horario: inicio,
      observacao: observacoes || null,
      clienteId,
      motoristaId,
      veiculoId,
      operacao: operacao || null,
      subOperacao: subOperacao || null,
      cargaEspecial: cargaEspecial ?? false,
      servicos: servicos ?? [],
      tipoVeiculo: tipoVeiculo || null,
      cpfMotorista: cpfMotorista || null,
      nomeMotorista: nomeMotorista || null,
      placaVeiculo: placaVeiculo || null,
      transportadora: transportadora || transportadoraNome || null,
      transportadoraContaId,
      empresa: empresa || null,
      awbMawb: Array.isArray(awbMawb) ? awbMawb.join(', ') : (awbMawb || null),
      diNumero: Array.isArray(diNumero) ? diNumero.join(', ') : (diNumero || null),
      dta: Array.isArray(dta) ? dta.join(', ') : (dta || null),
      hawb: Array.isArray(hawb) ? hawb.join(', ') : (hawb || null),
      numeroVoo: numeroVoo || null,
      volumes: volumes || null,
      peso: peso || null,
      consignatario: consignatario || null,
      container: container || null,
      criadoPorNome: user.name || null,
      criadoPorRole: user.role || null,
    },
    include: {
      motorista: true,
      veiculo: true,
      cliente: { select: { id: true, nome: true } },
    },
  });

  return NextResponse.json(agendamento, { status: 201 });
}

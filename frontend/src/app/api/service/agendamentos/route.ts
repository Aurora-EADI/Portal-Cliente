import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AgendamentoStatus } from '@prisma/client';
import { agendamentoEvents } from '@/lib/events';

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

const ACTIVE_STATUSES = [
  AgendamentoStatus.ATIVO,
  AgendamentoStatus.AG_CHEGADA,
  AgendamentoStatus.CHEGOU,
  AgendamentoStatus.ON_TIME,
  AgendamentoStatus.ATRASADO,
  AgendamentoStatus.CONCLUIDO,
];

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId') ?? undefined;
  const cnpjCliente = searchParams.get('cnpjCliente') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const excludeConcluido = searchParams.get('excludeConcluido') === '1';
  const dataInicio = searchParams.get('dataInicio') ?? undefined;
  const dataFim = searchParams.get('dataFim') ?? undefined;

  const effectiveStatuses = excludeConcluido
    ? ACTIVE_STATUSES.filter(s => s !== AgendamentoStatus.CONCLUIDO)
    : ACTIVE_STATUSES;

  const statusFilter = status
    ? { status: status as AgendamentoStatus }
    : { status: { in: effectiveStatuses } };

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      ...statusFilter,
      ...(clienteId ? {
        OR: [
          { di: { clienteId } },
          { clienteId },
        ],
      } : {}),
      ...(cnpjCliente ? { cliente: { cnpj: cnpjCliente } } : {}),
      ...(dataInicio && dataFim ? { data: { gte: dataInicio, lte: dataFim } } : {}),
      ...(dataInicio && !dataFim ? { data: { gte: dataInicio } } : {}),
    },
    include: {
      di: { include: { cliente: { select: { id: true, nome: true } } } },
      motorista: true,
      veiculo: true,
      cliente: { select: { id: true, nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
    take: 500,
  });

  return NextResponse.json({
    data: agendamentos,
    total: agendamentos.length,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      empresa,
      operacao,
      subOperacao,
      data,
      horario,
      cpfMotorista,
      nomeMotorista,
      placaVeiculo,
      tipoVeiculo,
      transportadora,
      cargaEspecial,
      servicos,
      diNumero,
      container,
      dta,
      volumes,
      peso,
      consignatario,
      observacao,
      criadoPorNome,
      criadoPorRole,
      cnpjCliente,
      enderecoCliente,
      telefoneCliente,
      emailCliente,
      cnpjTransportadora,
      enderecoTransportadora,
      telefoneTransportadora,
      emailTransportadora,
    } = body;

    if (!empresa || !operacao || !data || !horario || !cpfMotorista || !placaVeiculo) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: empresa, operacao, data, horario, cpfMotorista, placaVeiculo' },
        { status: 400 },
      );
    }

    // Locate or auto-create Cliente
    let clienteId: string | null = null;
    const cliente = await prisma.cliente.findFirst({
      where: { nome: { contains: empresa, mode: 'insensitive' } },
    });
    if (cliente) {
      clienteId = cliente.id;
    } else {
      // Create client on-the-fly so agendamento has a valid link
      const novoCliente = await prisma.cliente.create({
        data: { nome: empresa },
      });
      clienteId = novoCliente.id;
    }

    // Upsert Motorista
    let motoristaId: string | null = null;
    if (cpfMotorista && clienteId) {
      const cpfClean = cpfMotorista.replace(/\D/g, '');
      const allMotoristas = await prisma.motorista.findMany({ where: { clienteId } });
      let motorista = allMotoristas.find(m => m.cpf.replace(/\D/g, '') === cpfClean) ?? null;
      if (!motorista) {
        motorista = await prisma.motorista.create({
          data: { clienteId, nome: nomeMotorista || cpfMotorista, cpf: cpfMotorista, cnh: '', telefone: '' },
        });
      } else if (nomeMotorista && motorista.nome !== nomeMotorista) {
        motorista = await prisma.motorista.update({
          where: { id: motorista.id },
          data: { nome: nomeMotorista },
        });
      }
      motoristaId = motorista.id;
    }

    // Upsert Veiculo
    let veiculoId: string | null = null;
    if (placaVeiculo && clienteId) {
      const placaClean = placaVeiculo.replace(/\s/g, '').toUpperCase();
      let veiculo = await prisma.veiculo.findFirst({
        where: { clienteId, placa: { contains: placaClean, mode: 'insensitive' } },
      });
      if (!veiculo) {
        veiculo = await prisma.veiculo.create({
          data: {
            clienteId,
            placa: placaClean,
            modelo: tipoVeiculo || placaClean,
            tipo: tipoVeiculo || 'CAMINHAO',
          },
        });
      }
      veiculoId = veiculo.id;
    }

    const protocolo = `RET-${Date.now().toString(36).toUpperCase()}`;

    const agendamento = await prisma.agendamento.create({
      data: {
        protocolo,
        status: AgendamentoStatus.ATIVO,
        data,
        horario,
        clienteId,
        motoristaId,
        veiculoId,
        operacao: operacao || null,
        subOperacao: subOperacao || null,
        cargaEspecial: cargaEspecial ?? false,
        servicos: Array.isArray(servicos) ? servicos : [],
        tipoVeiculo: tipoVeiculo || null,
        cpfMotorista: cpfMotorista || null,
        nomeMotorista: nomeMotorista || null,
        placaVeiculo: placaVeiculo ? placaVeiculo.replace(/\s/g, '').toUpperCase() : null,
        transportadora: transportadora || null,
        empresa: empresa || null,
        diNumero: diNumero || null,
        container: container || null,
        dta: dta || null,
        volumes: volumes || null,
        peso: peso || null,
        consignatario: consignatario || null,
        observacao: observacao || null,
        criadoPorNome: criadoPorNome || null,
        criadoPorRole: criadoPorRole || 'AURORA_EMPLOYEE',
        cnpjCliente: cnpjCliente || null,
        enderecoCliente: enderecoCliente || null,
        telefoneCliente: telefoneCliente || null,
        emailCliente: emailCliente || null,
        cnpjTransportadora: cnpjTransportadora || null,
        enderecoTransportadora: enderecoTransportadora || null,
        telefoneTransportadora: telefoneTransportadora || null,
        emailTransportadora: emailTransportadora || null,
      },
      include: {
        motorista: true,
        veiculo: true,
        cliente: { select: { id: true, nome: true } },
      },
    });

    agendamentoEvents.emit('change', agendamento);

    return NextResponse.json(
      { protocolo: agendamento.protocolo, id: agendamento.id, agendamento },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[POST /api/service/agendamentos]', error);
    const msg = error?.meta?.cause ?? error?.message ?? 'Erro ao criar agendamento';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      n_lote, n_conhecimento, dta, documento_saida, tipo_documento,
      modalidade, cliente, cnpj_cliente, cod_despachante, despachante,
      saldo, dt_entrada, localizacao, containers, averbadoEm,
    } = body;

    if (!n_lote) {
      return NextResponse.json({ message: 'n_lote is required' }, { status: 400 });
    }

    if (cod_despachante && despachante) {
      await prisma.despachante.upsert({
        where: { codDespachante: String(cod_despachante) },
        create: {
          codDespachante: String(cod_despachante),
          nome: despachante,
        },
        update: { nome: despachante },
      });
    }

    if (cnpj_cliente && cliente) {
      const existing = await prisma.cliente.findFirst({ where: { cnpj: cnpj_cliente } });
      if (!existing) {
        await prisma.cliente.create({
          data: { nome: cliente, cnpj: cnpj_cliente },
        });
      }
    }

    const diAverbada = await prisma.diAverbada.upsert({
      where: { nLote: n_lote },
      create: {
        nLote: n_lote,
        nConhecimento: n_conhecimento ?? null,
        dta: dta ?? null,
        documentoSaida: documento_saida ?? null,
        tipoDocumento: tipo_documento ?? null,
        modalidade: modalidade ?? null,
        cliente: cliente ?? null,
        cnpjCliente: cnpj_cliente ?? null,
        codDespachante: cod_despachante ? String(cod_despachante) : null,
        despachante: despachante ?? null,
        saldo: saldo != null ? Number(saldo) : null,
        dtEntrada: dt_entrada ? new Date(dt_entrada) : null,
        localizacao: localizacao ?? null,
        containers: containers ?? null,
        averbadoEm: averbadoEm ? new Date(averbadoEm) : new Date(),
        status: 'liberada',
      },
      update: {
        nConhecimento: n_conhecimento ?? null,
        dta: dta ?? null,
        documentoSaida: documento_saida ?? null,
        tipoDocumento: tipo_documento ?? null,
        modalidade: modalidade ?? null,
        cliente: cliente ?? null,
        cnpjCliente: cnpj_cliente ?? null,
        codDespachante: cod_despachante ? String(cod_despachante) : null,
        despachante: despachante ?? null,
        saldo: saldo != null ? Number(saldo) : null,
        dtEntrada: dt_entrada ? new Date(dt_entrada) : null,
        localizacao: localizacao ?? null,
        containers: containers ?? null,
        averbadoEm: averbadoEm ? new Date(averbadoEm) : new Date(),
        sincronizadoEm: new Date(),
      },
    });

    return NextResponse.json(diAverbada, { status: 201 });
  } catch (error: any) {
    console.error('[service/dis-averbadas] POST error:', error.message);
    return NextResponse.json({ message: 'Failed to sync DI averbada' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = requireServiceKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const codDespachante = searchParams.get('codDespachante') ?? undefined;

  const dis = await prisma.diAverbada.findMany({
    where: codDespachante ? { codDespachante } : undefined,
    orderBy: { sincronizadoEm: 'desc' },
  });

  return NextResponse.json({ data: dis, total: dis.length });
}

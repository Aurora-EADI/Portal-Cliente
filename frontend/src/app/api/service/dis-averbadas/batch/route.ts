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
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'items array is required' }, { status: 400 });
    }

    const despachantesSet = new Map<string, string>();
    const clientesSet = new Map<string, string>();

    for (const item of items) {
      if (item.cod_despachante && item.despachante) {
        despachantesSet.set(String(item.cod_despachante), item.despachante);
      }
      if (item.cnpj_cliente && item.cliente) {
        clientesSet.set(item.cnpj_cliente, item.cliente);
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const [cod, nome] of despachantesSet) {
        await tx.despachante.upsert({
          where: { codDespachante: cod },
          create: { codDespachante: cod, nome },
          update: { nome },
        });
      }

      for (const [cnpj, nome] of clientesSet) {
        const existing = await tx.cliente.findFirst({ where: { cnpj } });
        if (!existing) {
          await tx.cliente.create({ data: { nome, cnpj } });
        }
      }

      for (const item of items) {
        await tx.diAverbada.upsert({
          where: { nLote: item.n_lote },
          create: {
            nLote: item.n_lote,
            nConhecimento: item.n_conhecimento ?? null,
            dta: item.dta ?? null,
            documentoSaida: item.documento_saida ?? null,
            tipoDocumento: item.tipo_documento ?? null,
            modalidade: item.modalidade ?? null,
            cliente: item.cliente ?? null,
            cnpjCliente: item.cnpj_cliente ?? null,
            codDespachante: item.cod_despachante ? String(item.cod_despachante) : null,
            despachante: item.despachante ?? null,
            saldo: item.saldo != null ? Number(item.saldo) : null,
            dtEntrada: item.dt_entrada ? new Date(item.dt_entrada) : null,
            localizacao: item.localizacao ?? null,
            containers: item.containers ?? null,
            averbadoEm: item.averbadoEm ? new Date(item.averbadoEm) : new Date(),
            status: 'liberada',
          },
          update: {
            nConhecimento: item.n_conhecimento ?? null,
            dta: item.dta ?? null,
            documentoSaida: item.documento_saida ?? null,
            tipoDocumento: item.tipo_documento ?? null,
            modalidade: item.modalidade ?? null,
            cliente: item.cliente ?? null,
            cnpjCliente: item.cnpj_cliente ?? null,
            codDespachante: item.cod_despachante ? String(item.cod_despachante) : null,
            despachante: item.despachante ?? null,
            saldo: item.saldo != null ? Number(item.saldo) : null,
            dtEntrada: item.dt_entrada ? new Date(item.dt_entrada) : null,
            localizacao: item.localizacao ?? null,
            containers: item.containers ?? null,
            averbadoEm: item.averbadoEm ? new Date(item.averbadoEm) : new Date(),
            sincronizadoEm: new Date(),
          },
        });
      }
    });

    return NextResponse.json({ synced: items.length }, { status: 201 });
  } catch (error: any) {
    console.error('[service/dis-averbadas/batch] POST error:', error.message);
    return NextResponse.json({ message: 'Batch sync failed' }, { status: 500 });
  }
}

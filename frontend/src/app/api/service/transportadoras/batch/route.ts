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

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of items) {
      const cnpjDigits = String(item.cnpj_cpf ?? '').replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        skipped += 1;
        continue;
      }

      const nome = item.nomefantasia ?? item.razaosocial ?? null;
      if (!nome) {
        skipped += 1;
        continue;
      }

      try {
        await prisma.transportadoraConta.upsert({
          where: { cnpj: cnpjDigits },
          create: {
            cnpj: cnpjDigits,
            nome,
            codTransp: item.cod_transp ? String(item.cod_transp) : null,
            email: item.emails ?? null,
            telefone: item.telefones_contato ?? null,
          },
          update: {
            nome,
            codTransp: item.cod_transp ? String(item.cod_transp) : null,
            email: item.emails ?? null,
            telefone: item.telefones_contato ?? null,
          },
        });
        synced += 1;
      } catch (itemError: any) {
        console.error(`[service/transportadoras/batch] upsert failed for cnpj ${cnpjDigits}:`, itemError.message);
        failed += 1;
      }
    }

    return NextResponse.json({ synced, skipped, failed }, { status: 201 });
  } catch (error: any) {
    console.error('[service/transportadoras/batch] POST error:', error.message);
    return NextResponse.json({ message: 'Batch sync failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

const SERVICE_KEY = process.env.SERVICE_API_KEY;
const CHUNK_SIZE = 25;

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

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
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

    const valid: { cnpjDigits: string; nome: string; codTransp: string | null; email: string | null; telefone: string | null }[] = [];

    for (const item of items) {
      const cnpjDigits = String(item.cnpj_cpf ?? '').replace(/\D/g, '');
      const nome = item.nomefantasia ?? item.razaosocial ?? null;
      if (cnpjDigits.length !== 14 || !nome) {
        skipped += 1;
        continue;
      }
      valid.push({
        cnpjDigits,
        nome,
        codTransp: item.cod_transp ? String(item.cod_transp) : null,
        email: item.emails ?? null,
        telefone: item.telefones_contato ?? null,
      });
    }

    for (const batch of chunk(valid, CHUNK_SIZE)) {
      const results = await Promise.allSettled(
        batch.map((v) =>
          prisma.transportadoraConta.upsert({
            where: { cnpj: v.cnpjDigits },
            create: { cnpj: v.cnpjDigits, nome: v.nome, codTransp: v.codTransp, email: v.email, telefone: v.telefone },
            update: { nome: v.nome, codTransp: v.codTransp, email: v.email, telefone: v.telefone },
          }),
        ),
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          synced += 1;
        } else {
          failed += 1;
          console.error(`[service/transportadoras/batch] upsert failed for cnpj ${batch[i].cnpjDigits}:`, result.reason?.message ?? result.reason);
        }
      }
    }

    return NextResponse.json({ synced, skipped, failed }, { status: 201 });
  } catch (error: any) {
    console.error('[service/transportadoras/batch] POST error:', error.message);
    return NextResponse.json({ message: 'Batch sync failed' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { resolveUserFromToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { disAverbadaEvents } from '@/lib/events';
import { UserRole } from '@prisma/client';

export const runtime = 'nodejs';

const PING_INTERVAL_MS = 20_000;

function mapDiAverbada(da: any) {
  return {
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
  };
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const auth = await resolveUserFromToken(token);
  if (auth.error) return auth.error;
  const user = auth.user;

  let allowedTransportadoraContaIds: Set<string> | null = null;
  let allowedCodDespachante: string | null = null;
  let allowedCnpjCliente: string | null = null;

  if (user.role === UserRole.DESPACHANTE) {
    if (!user.despachanteId) return new Response('Forbidden', { status: 403 });
    const despachante = await prisma.despachante.findUnique({
      where: { id: user.despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) return new Response('Forbidden', { status: 403 });
    allowedCodDespachante = despachante.codDespachante;
  } else if (user.role === UserRole.CLIENTE) {
    if (!user.clienteId) return new Response('Forbidden', { status: 403 });
    const cliente = await prisma.cliente.findUnique({
      where: { id: user.clienteId },
      select: { cnpj: true },
    });
    if (!cliente?.cnpj) return new Response('Forbidden', { status: 403 });
    allowedCnpjCliente = cliente.cnpj;
  } else if (user.role === UserRole.TRANSPORTADORA) {
    if (!user.transportadoraContaId) return new Response('Forbidden', { status: 403 });
    allowedTransportadoraContaIds = new Set([user.transportadoraContaId]);
  } else if (user.role !== UserRole.ADMIN && user.role !== UserRole.EMPLOYEE) {
    return new Response('Forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  let pingTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const isAllowed = async (row: any): Promise<boolean> => {
        if (!row) return false;
        if (allowedCodDespachante !== null) return row.codDespachante === allowedCodDespachante;
        if (allowedCnpjCliente !== null) return row.cnpjCliente === allowedCnpjCliente;
        if (allowedTransportadoraContaIds !== null) {
          const atribuicao = await prisma.diTransportadoraAtribuicao.findFirst({
            where: { nLote: row.nLote, transportadoraContaId: { in: [...allowedTransportadoraContaIds] } },
            select: { id: true },
          });
          return !!atribuicao;
        }
        return true;
      };

      const onChange = async (row: any) => {
        if (await isAllowed(row)) {
          send(mapDiAverbada(row));
        }
      };

      disAverbadaEvents.on('change', onChange);

      pingTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, PING_INTERVAL_MS);

      request.signal.addEventListener('abort', () => {
        if (pingTimer) clearInterval(pingTimer);
        disAverbadaEvents.off('change', onChange);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

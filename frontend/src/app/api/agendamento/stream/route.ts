import { NextRequest } from 'next/server';
import { resolveUserFromToken } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UserRole } from '@prisma/client';
import { getDespachanteClienteIds } from '@/lib/despachante-utils';

export const runtime = 'nodejs';

const PING_INTERVAL_MS = 20_000;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const auth = await resolveUserFromToken(token);
  if (auth.error) return auth.error;
  const user = auth.user;

  let allowedClienteIds: Set<string> | null = null;
  let allowedTransportadoraContaId: string | null = null;

  if (user.role === UserRole.CLIENTE) {
    if (!user.clienteId) return new Response('Forbidden', { status: 403 });
    allowedClienteIds = new Set([user.clienteId]);
  } else if (user.role === UserRole.DESPACHANTE) {
    if (!user.despachanteId) return new Response('Forbidden', { status: 403 });
    const clienteIds = await getDespachanteClienteIds(user.despachanteId);
    if (!clienteIds.length) return new Response('Forbidden', { status: 403 });
    allowedClienteIds = new Set(clienteIds);
  } else if (user.role === UserRole.TRANSPORTADORA) {
    if (!user.transportadoraContaId) return new Response('Forbidden', { status: 403 });
    allowedTransportadoraContaId = user.transportadoraContaId;
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

      const isAllowed = (row: { clienteId: string | null; diClienteId: string | null; transportadoraContaId: string | null }): boolean => {
        if (allowedClienteIds !== null) {
          return (row.clienteId !== null && allowedClienteIds.has(row.clienteId))
            || (row.diClienteId !== null && allowedClienteIds.has(row.diClienteId));
        }
        if (allowedTransportadoraContaId !== null) {
          return row.transportadoraContaId === allowedTransportadoraContaId;
        }
        return true;
      };

      const channel = supabaseAdmin
        .channel(`agendamentos-changes-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agendamentos' },
          async (payload) => {
            const changed = (payload.new ?? payload.old) as any;
            if (!changed?.id) return;

            const agendamento = await prisma.agendamento.findUnique({
              where: { id: changed.id },
              include: {
                di: { include: { cliente: { select: { id: true, nome: true } } } },
                motorista: true,
                veiculo: true,
                cliente: { select: { id: true, nome: true } },
              },
            });

            if (!agendamento) {
              if (isAllowed({ clienteId: changed.clienteId ?? null, diClienteId: null, transportadoraContaId: changed.transportadoraContaId ?? null })) {
                send({ id: changed.id, deleted: true });
              }
              return;
            }

            if (isAllowed({
              clienteId: agendamento.clienteId,
              diClienteId: agendamento.di?.cliente?.id ?? null,
              transportadoraContaId: agendamento.transportadoraContaId,
            })) {
              send(agendamento);
            }
          },
        )
        .subscribe();

      pingTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, PING_INTERVAL_MS);

      request.signal.addEventListener('abort', () => {
        if (pingTimer) clearInterval(pingTimer);
        supabaseAdmin.removeChannel(channel);
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

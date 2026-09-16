import type { NextRequest } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
]);

function backendUrl(path: string[], search: string): URL {
  const base = process.env.NEST_API_INTERNAL_URL || 'http://localhost:3030/api';
  const url = new URL(base);
  const basePath = url.pathname.replace(/\/$/, '');
  url.pathname = `${basePath}/${path.map(encodeURIComponent).join('/')}`;
  url.search = search;
  return url;
}

/**
 * O Next é somente a borda web. Mantemos o prefixo same-origin /api por
 * compatibilidade com o browser e encaminhamos a requisição ao Nest; não há
 * sessão, JWT, Prisma ou regra de domínio neste processo.
 */
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);

  const response = await fetch(backendUrl(path, request.nextUrl.search), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
    // Necessário para upload e SSE sem o Next bufferizar o corpo.
    // @ts-expect-error duplex is supported by the Node fetch implementation.
    duplex: 'half',
  });

  const responseHeaders = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) responseHeaders.delete(header);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
export const dynamic = 'force-dynamic';

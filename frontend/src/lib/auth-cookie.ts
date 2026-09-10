import type { NextResponse } from 'next/server';

/**
 * O token de sessao vive num cookie httpOnly, nunca em localStorage nem num
 * cookie legivel por JS. Este portal e exposto na internet: qualquer script de
 * terceiro na pagina que consiga ler o token consegue se passar pelo usuario.
 *
 * O frontend nao precisa mais ler o token — o navegador o envia sozinho em toda
 * requisicao same-origin (inclusive EventSource). Para saber quando a sessao
 * expira, use `expires_at`, devolvido no corpo do login.
 */
export const AUTH_COOKIE = 'access_token';

/** Mantido em sincronia com JWT_EXPIRES_IN (default 24h) em lib/jwt.ts. */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export function sessionExpiresAt(): string {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' e nao 'strict' para que o usuario que chega por um link externo
    // (convite por e-mail, WhatsApp) caia logado em vez de na tela de login.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

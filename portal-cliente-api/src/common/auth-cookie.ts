import type { CookieOptions, Response } from 'express';

/**
 * Espelha frontend/src/lib/auth-cookie.ts. O token de sessao so trafega em
 * cookie httpOnly — este portal e exposto e um token legivel por JS pode ser
 * exfiltrado por qualquer script na pagina.
 */
export const AUTH_COOKIE = 'access_token';

export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function sessionExpiresAt(): string {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    ...baseOptions(),
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    ...baseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, baseOptions());
  res.clearCookie('refresh_token', baseOptions());
}

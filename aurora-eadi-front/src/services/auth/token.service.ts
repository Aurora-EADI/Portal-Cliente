import axios from 'axios';

/**
 * Serviço de gerenciamento de sessão no frontend (cookie-based auth)
 * Os JWT tokens ficam em cookies httpOnly gerenciados pelo backend.
 * Aqui armazenamos apenas o tempo de expiração para evitar round-trips desnecessários.
 */

// Chave de expiração no sessionStorage (não contém tokens — apenas timestamp)
const EXPIRES_AT_KEY = 'token_expires_at';

/**
 * Salva o timestamp de expiração do access token
 */
export function saveTokenExpiry(expiresAt: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(EXPIRES_AT_KEY, expiresAt);
}

/**
 * Retorna o timestamp de expiração armazenado
 */
export function getTokenExpiry(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(EXPIRES_AT_KEY);
}

/**
 * Verifica se a sessão está expirada com base no expires_at armazenado
 */
export function isSessionExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return new Date(expiry).getTime() < Date.now();
}

/**
 * Renova o access token via cookie httpOnly refresh_token
 * Retorna o novo expires_at (string ISO) se bem-sucedido, ou null se falhar
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

    // POST sem body — o browser envia o cookie refresh_token automaticamente
    const response = await axios.post(`${apiUrl}/auth/refresh`, null, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });

    const { expires_at } = response.data;

    if (expires_at) {
      saveTokenExpiry(expires_at);
    }

    // Retorna expires_at (truthy) para sinalizar sucesso ao caller
    return expires_at ?? 'ok';
  } catch {
    clearAllAuthData();
    return null;
  }
}

/**
 * Realiza logout via cookie httpOnly — o backend limpa os cookies
 */
export async function logout(): Promise<void> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

    // POST sem body — o backend limpa os cookies httpOnly via Set-Cookie
    await axios.post(`${apiUrl}/auth/logout`, null, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Continua mesmo se falhar — os dados locais serão limpos abaixo
  }
}

/**
 * Limpa todos os dados de autenticação locais.
 * Nota: os cookies httpOnly são limpos pelo backend via Set-Cookie no logout.
 */
export function clearAllAuthData(): void {
  if (typeof window === 'undefined') return;

  // Remove expiração do access token
  sessionStorage.removeItem(EXPIRES_AT_KEY);

  // Remove dados de sessão e permissões do localStorage
  localStorage.removeItem('auth_session');
  localStorage.removeItem('user_permissions');

  // Limpa o cache de módulos e rotas
  sessionStorage.clear();

  // Remove o cookie de sessão não-httpOnly (usado pelo middleware Next.js)
  document.cookie = 'auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

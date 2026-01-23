import axios from 'axios';
import { isTokenExpired } from '@/lib/jwt-helper';

/**
 * Serviço de gerenciamento de tokens no frontend
 * Centraliza toda a lógica de armazenamento e renovação de tokens
 */

// Chaves do localStorage
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Salva tokens no localStorage
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Obtém o access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Obtém o refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Remove todos os tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Verifica se o access token está válido (existe e não expirou)
 */
export function hasValidAccessToken(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  return !isTokenExpired(token);
}

/**
 * Verifica se o refresh token está válido
 */
export function hasValidRefreshToken(): boolean {
  const token = getRefreshToken();
  if (!token) return false;

  return !isTokenExpired(token);
}

/**
 * Renova o access token usando o refresh token
 * Retorna o novo access token ou null se falhar
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.error('[TOKEN SERVICE] Refresh token não encontrado');
    return null;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

    // Faz requisição direta sem usar a instância do axios (evita interceptor loop)
    const response = await axios.post(
      `${apiUrl}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const { access_token } = response.data;

    if (!access_token) {
      console.error('[TOKEN SERVICE] Resposta inválida do refresh endpoint');
      return null;
    }

    // Salva o novo access token
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);

    console.log('[TOKEN SERVICE] Access token renovado com sucesso');
    return access_token;
  } catch (error: any) {
    console.error('[TOKEN SERVICE] Erro ao renovar token:', error.message);

    // Se o refresh falhou, provavelmente o refresh token expirou
    // Limpa todos os tokens
    clearTokens();

    return null;
  }
}

/**
 * Verifica se o access token está expirado e renova se necessário
 * Retorna true se o token está válido (após renovação se necessário)
 */
export async function ensureValidAccessToken(): Promise<boolean> {
  const accessToken = getAccessToken();

  // Não tem access token
  if (!accessToken) {
    // Tenta renovar usando refresh token
    const newToken = await refreshAccessToken();
    return newToken !== null;
  }

  // Tem access token, verifica se está expirado
  if (isTokenExpired(accessToken)) {
    // Token expirado, tenta renovar
    const newToken = await refreshAccessToken();
    return newToken !== null;
  }

  // Token válido
  return true;
}

/**
 * Realiza logout revogando o refresh token no backend
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

      await axios.post(
        `${apiUrl}/auth/logout`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('[TOKEN SERVICE] Logout realizado com sucesso');
    } catch (error: any) {
      console.error('[TOKEN SERVICE] Erro ao fazer logout:', error.message);
      // Continua mesmo se falhar (limpa local)
    }
  }

  // Limpa tokens locais
  clearTokens();
}

/**
 * Limpa todos os dados de autenticação (tokens, sessão, cache)
 */
export function clearAllAuthData(): void {
  if (typeof window === 'undefined') return;

  // Limpa tokens
  clearTokens();

  // Limpa dados de sessão
  localStorage.removeItem('auth_session');
  localStorage.removeItem('user_permissions');

  // Limpa cache de módulos
  sessionStorage.clear();

  // Limpa cookies
  const cookies = ['auth_session', 'token', 'access_token', 'refresh_token'];
  cookies.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  console.log('[TOKEN SERVICE] Todos os dados de autenticação foram limpos');
}

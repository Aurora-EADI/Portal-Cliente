import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type SessionRequest = InternalAxiosRequestConfig & { _sessionProbe?: boolean };

// Rotas onde um 401 e resposta esperada para visitante anonimo — redirecionar
// dali jogaria quem esta se cadastrando para fora do fluxo.
const PUBLIC_PATHS = new Set([
  '/',
  '/registro',
  '/session-expired',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

/**
 * Fabrica os clients HTTP do portal. Existem dois destinos hoje — as Route
 * Handlers do proprio Next e o portal-cliente-api (NestJS) — e os dois precisam
 * do mesmo comportamento: cookie de sessao junto e 401 levando a
 * /session-expired.
 *
 * `withCredentials` e o que faz o cookie httpOnly viajar. Nao existe injecao
 * manual de Authorization: a sessao Better Auth nao e legivel por JS.
 */
export function createHttpClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.NEXT_PUBLIC_API_KEY
        ? { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY }
        : {}),
    },
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const request = error.config as SessionRequest | undefined;
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        const url = String(request?.url || '');
        const isAuthEndpoint = url.includes('/auth') || url.includes('/sign-in') || url.includes('/login');
        if (!request?._sessionProbe && !isAuthEndpoint && !PUBLIC_PATHS.has(window.location.pathname)) {
          window.location.href = '/session-expired';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

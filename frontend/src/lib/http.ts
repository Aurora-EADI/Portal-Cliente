import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type SessionRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionProbe?: boolean };

// Rotas onde um 401 e resposta esperada para visitante anonimo — redirecionar
// dali jogaria quem esta se cadastrando para fora do fluxo.
const PUBLIC_PATHS = new Set(['/', '/registro', '/session-expired']);

/**
 * Fabrica os clients HTTP do portal. Existem dois destinos hoje — as Route
 * Handlers do proprio Next e o portal-cliente-api (NestJS) — e os dois precisam
 * do mesmo comportamento: cookie de sessao junto e 401 levando a
 * /session-expired.
 *
 * `withCredentials` e o que faz o cookie httpOnly viajar. Nao existe injecao
 * manual de Authorization: o token nao e legivel por JS (ver lib/auth-cookie.ts).
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

  let refresh: Promise<unknown> | null = null;
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const request = error.config as SessionRequest | undefined;
      const isAuthRequest = /^\/auth\/(login|logout|refresh)$/.test(request?.url || '');
      if (error.response?.status === 401 && request && !isAuthRequest && !request._retry) {
        request._retry = true;
        try {
          if (!refresh) {
            refresh = client.post('/auth/refresh').finally(() => { refresh = null; });
          }
          await refresh;
          return client(request);
        } catch (refreshError) {
          const status = (refreshError as AxiosError).response?.status;
          // The Next auth routes have no refresh endpoint; Nest uses an httpOnly cookie.
          if (![400, 401, 403, 404, 405].includes(status || 0)) {
            return Promise.reject(refreshError);
          }
        }
      }
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        if (!isAuthRequest && !request?._sessionProbe && !PUBLIC_PATHS.has(window.location.pathname)) {
          window.location.href = '/session-expired';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

import axios, { AxiosError, AxiosInstance } from 'axios';

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

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        if (!PUBLIC_PATHS.has(window.location.pathname)) {
          window.location.href = '/session-expired';
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

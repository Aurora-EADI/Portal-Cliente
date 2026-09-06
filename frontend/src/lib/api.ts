import axios, { AxiosError } from 'axios';

const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

// O token de sessao vive num cookie httpOnly (ver lib/auth-cookie.ts). Nao ha
// mais injecao manual de Authorization: withCredentials manda o cookie sozinho.
export const api = axios.create({
  baseURL: backendApiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NEXT_PUBLIC_API_KEY ? { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY } : {}),
  },
});

// Rotas onde um 401 e resposta esperada para visitante anonimo — redirecionar
// dali jogaria quem esta se cadastrando para fora do fluxo.
const PUBLIC_PATHS = new Set(['/', '/registro', '/session-expired']);

api.interceptors.response.use(
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

export default api;

import { createHttpClient } from './http';

// O Next não acessa banco nem implementa autenticação. Todas as chamadas de
// domínio seguem para o NestJS, normalmente pelo caminho same-origin /api.
export const api = createHttpClient(
  process.env.NEXT_PUBLIC_NEST_API_URL || process.env.NEXT_PUBLIC_API_URL || '/api',
);

export default api;

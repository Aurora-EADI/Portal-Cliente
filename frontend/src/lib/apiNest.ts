import { createHttpClient } from './http';

/**
 * Client do portal-cliente-api (NestJS) — destino dos modulos novos:
 * averbacao, procuracoes, tipos de documento.
 *
 * Em producao, front e Nest ficam no mesmo hostname atras do Traefik; por
 * isso o caminho relativo e o padrao seguro para chamadas feitas pelo browser.
 * Uma URL absoluta continua disponivel para ambientes que realmente precisem
 * dela, via `NEXT_PUBLIC_NEST_API_URL`.
 */
export const apiNest = createHttpClient(
  process.env.NEXT_PUBLIC_NEST_API_URL || '/api',
);

export default apiNest;

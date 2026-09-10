import { createHttpClient } from './http';

/**
 * Client do portal-cliente-api (NestJS) — destino dos modulos novos:
 * averbacao, procuracoes, tipos de documento.
 *
 * Em dev o Nest fica noutra porta (`localhost:5001`). E outra *origem*, mas o
 * mesmo *site*: SameSite ignora a porta, entao o cookie httpOnly gravado pelo
 * Next viaja junto. O que a porta diferente exige e CORS com
 * `credentials: true` no Nest e `CORS_ORIGIN` apontando para o front.
 *
 * Quando houver producao, front e Nest ficam no mesmo hostname atras do
 * Traefik (prefixos de path especificos roteados para o Nest) e esta variavel
 * passa a ser um caminho relativo, como ja acontece no Portal Aurora.
 */
export const apiNest = createHttpClient(
  process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:5001/api',
);

export default apiNest;

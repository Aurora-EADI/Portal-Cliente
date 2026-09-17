/**
 * Regras de container no navegador.
 *
 * Espelho de `portal-cliente-api/src/common/containers.ts`. A API é quem decide
 * — aqui é só para a pessoa ver o erro enquanto digita, em vez de descobrir no
 * envio. Mantidos iguais de propósito: divergir faria a tela aceitar o que a
 * API recusa.
 */

export const MAX_CONTAINERS = 50;

/** Só letras e dígitos, maiúsculas. */
export function normalizarContainer(valor: string): string {
  return (valor ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** `CAAU 957212-0`, `CAAU9572120`, `CAAU-957212-0` — como cada fonte escreve. */
const PADRAO_ISO_SOLTO = /[A-Z]{4}[\s-]*\d{6}[\s-]*\d/g;

/**
 * Quebra o texto colado em vários containers.
 *
 * Procurar o padrão ISO vem primeiro porque o separador não é confiável: o
 * SIAUM devolve `CAAU 957212-0 / ONEU 245917-1`, com espaço DENTRO do container
 * e barra entre eles — quebrar por espaço partiria cada um em dois.
 */
export function separarContainers(texto: string): string[] {
  const maiusculo = (texto ?? '').toUpperCase();

  const iso = maiusculo.match(PADRAO_ISO_SOLTO);
  if (iso?.length) return iso.map(normalizarContainer);

  return maiusculo
    .split(/[\s,;/\n\r\t]+/)
    .map(normalizarContainer)
    .filter(Boolean);
}

/**
 * Valor de cada letra no ISO 6346: começa em 10 e pula os múltiplos de 11, que
 * a norma reserva. Dá A=10, B=12, …, K=21, L=23, …, U=32, V=34, …, Z=38.
 */
const VALOR_DA_LETRA: Record<string, number> = (() => {
  const mapa: Record<string, number> = {};
  let valor = 10;
  for (let i = 0; i < 26; i++) {
    while (valor % 11 === 0) valor++;
    mapa[String.fromCharCode(65 + i)] = valor;
    valor++;
  }
  return mapa;
})();

/**
 * Container no padrão ISO 6346, com dígito verificador conferido.
 *
 * O formato sozinho aceita erro de digitação — um dígito trocado continua com
 * 4 letras e 7 números. Como o container é o que desempata o vínculo com o
 * SIAUM, esse erro só apareceria na conferência do analista.
 */
export function ehContainerIso6346(valor: string): boolean {
  const c = normalizarContainer(valor);
  if (!/^[A-Z]{4}\d{7}$/.test(c)) return false;

  let soma = 0;
  for (let i = 0; i < 10; i++) {
    const ch = c[i];
    const v = /[A-Z]/.test(ch) ? VALOR_DA_LETRA[ch] : Number(ch);
    soma += v * 2 ** i;
  }

  const verificador = soma % 11 === 10 ? 0 : soma % 11;
  return verificador === Number(c[10]);
}

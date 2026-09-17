import { BadRequestException } from '@nestjs/common';
import { Modalidade } from '@prisma/client';

/**
 * Regras do que o despachante declara como identificação da carga.
 *
 * Marítimo aceita vários containers; as outras modalidades continuam com um
 * conhecimento de transporte só. Fica fora do DTO porque a regra depende da
 * modalidade, que o DTO de edição nem recebe — lá ela vem do processo gravado.
 */

/** Teto de itens por processo. O maior lote real do SIAUM tem 16 containers. */
export const MAX_CONTAINERS = 50;

/** Só letras e dígitos, maiúsculas: máscara e espaço não identificam carga. */
export function normalizarContainer(valor: string): string {
  return (valor ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** `CAAU 957212-0`, `CAAU9572120`, `CAAU-957212-0` — como cada fonte escreve. */
const PADRAO_ISO_SOLTO = /[A-Z]{4}[\s-]*\d{6}[\s-]*\d/g;

/**
 * Quebra texto colado em vários itens.
 *
 * Procurar o padrão ISO vem primeiro porque o separador não é confiável: o
 * SIAUM devolve `CAAU 957212-0 / ONEU 245917-1`, com espaço DENTRO do container
 * e barra entre eles. Quebrar por espaço partiria cada container em dois.
 *
 * Sem nenhum container reconhecido — caso do conhecimento aéreo ou rodoviário,
 * que não tem formato fixo — cai na quebra por separadores.
 *
 * Serve à entrada de vários containers, que só existe no marítimo. Não usar no
 * campo de conhecimento: lá `CRT 001234` é um valor só, e aqui viraria dois.
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
 * Container marítimo no padrão ISO 6346, com dígito verificador conferido.
 *
 * O formato sozinho aceita erro de digitação (um dígito trocado continua com
 * 4 letras e 7 números). Como o container é o que desempata o vínculo com o
 * SIAUM, um erro aqui só apareceria na conferência do analista.
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

export interface ContainersResolvidos {
  /** Lista completa, normalizada e sem repetição. */
  containers: string[];
  /** Primeiro item — o que vai para `containerConhecimento`. */
  principal: string;
}

/**
 * Valida e normaliza o que foi declarado, seja pela lista nova (`containers`)
 * ou pelo campo antigo (`containerConhecimento`).
 *
 * Aceitar os dois é o que permite subir a API antes do front: cliente antigo
 * manda um texto, cliente novo manda a lista, e os dois gravam igual.
 */
export function resolverContainers(
  modalidade: Modalidade,
  entrada: { containers?: string[]; containerConhecimento?: string },
): ContainersResolvidos {
  const bruto = entrada.containers?.length
    ? entrada.containers
    : entrada.containerConhecimento
      ? [entrada.containerConhecimento]
      : [];

  const containers = [...new Set(bruto.map(normalizarContainer))].filter(Boolean);

  if (!containers.length) {
    throw new BadRequestException(
      modalidade === Modalidade.MARITIMO
        ? 'Informe ao menos um container'
        : 'Informe o conhecimento de transporte',
    );
  }

  if (containers.length > MAX_CONTAINERS) {
    throw new BadRequestException(
      `Máximo de ${MAX_CONTAINERS} containers por processo`,
    );
  }

  if (modalidade === Modalidade.MARITIMO) {
    const invalidos = containers.filter((c) => !ehContainerIso6346(c));
    if (invalidos.length) {
      throw new BadRequestException(
        `Container fora do padrão ISO 6346 (AAAA9999999, com dígito verificador): ${invalidos.join(', ')}`,
      );
    }
  } else if (containers.length > 1) {
    // Aéreo, rodoviário e ferroviário andam por conhecimento de transporte, que
    // é um por processo. Aceitar vários aqui esconderia um erro de digitação.
    throw new BadRequestException(
      'Esta modalidade aceita apenas um conhecimento de transporte',
    );
  }

  return { containers, principal: containers[0] };
}

/**
 * Documento de saída do processo: DI ou DUIMP, gravados no mesmo campo
 * `diDuimp` e distinguidos pelo próprio formato.
 *
 * DI: a spec pede `^\d{2}/\d{9}$`, mas nenhuma DI real do sistema casa com
 * isso: o formato em uso é 22/2564365-1 — dois dígitos, barra, sete dígitos,
 * hífen e dígito verificador. Aceita as duas formas para não recusar DI
 * legítima já cadastrada.
 *
 * DUIMP: ano, "BR", dez dígitos, hífen e verificador — 26BR0000349821-3.
 */
export const DOCUMENTO_SAIDA_REGEX =
  /^(\d{2}\/(\d{7}-\d|\d{9})|\d{2}BR\d{10}-\d)$/;

export const DOCUMENTO_SAIDA_MENSAGEM =
  'Informe a DI no formato XX/XXXXXXX-X ou a DUIMP no formato XXBRXXXXXXXXXX-X';

/** "DI" ou "DUIMP", para mensagens que citam o número. */
export function rotuloDocumentoSaida(valor: string): 'DI' | 'DUIMP' {
  return /^\d{2}BR/.test(valor) ? 'DUIMP' : 'DI';
}

/** Aceita a DUIMP digitada com "br" minúsculo ou espaços nas pontas. */
export function normalizarDocumentoSaida(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string, includeSymbol: boolean = true): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return includeSymbol ? 'R$ 0,00' : '0,00';
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);

  return includeSymbol ? formatted : formatted.replace('R$', '').trim();
}

/**
 * Formata um número como moeda americana (USD)
 * @param value - Valor numérico a ser formatado
 * @param includeSymbol - Se deve incluir o símbolo $ (padrão: true)
 * @returns String formatada no padrão americano (ex: $ 1,950.89)
 * @example
 * formatUSD(1950.89) // "$ 1,950.89"
 * formatUSD(1950.89, false) // "1,950.89"
 */
export function formatUSD(value: number | string, includeSymbol: boolean = true): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return includeSymbol ? '$ 0.00' : '0.00';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);

  return formatted;
}

export function formatPercent(value: number | string, decimals: number = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0,00%';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue) + '%';
}

export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Formata uma data (string ISO ou Date) para o formato brasileiro (dd/mm/yyyy)
 * sem problemas de timezone.
 *
 * @param dateString - String de data ISO (ex: "2026-06-15" ou "2026-06-15T00:00:00.000Z") ou objeto Date
 * @returns String formatada no padrão brasileiro (ex: "15/06/2026")
 * @example
 * formatDateBR("2026-06-15T00:00:00.000Z") // "15/06/2026"
 * formatDateBR("2026-06-15") // "15/06/2026"
 */
export function formatDateBR(dateString?: string | Date | null): string {
  if (!dateString) return '-';

  // Se for um objeto Date, converte para string ISO
  const dateStr = dateString instanceof Date
    ? dateString.toISOString()
    : dateString;

  // Extrai apenas a parte da data (YYYY-MM-DD) ignorando timezone
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-');

  // Retorna formatado como dd/mm/yyyy
  return `${day}/${month}/${year}`;
}

/**
 * Tipos de status de validade de um documento
 */
export type ValidityStatus = 'OK' | 'ALERT' | 'EXPIRED';

/**
 * Calcula o status de validade de um documento com base na data de expiração.
 * - EXPIRED: Já venceu.
 * - ALERT: Vence em até 15 dias.
 * - OK: Vence em mais de 15 dias ou não possui data de expiração.
 *
 * @param dateExpiration - Data de expiração (string ISO ou objeto Date)
 * @returns Status da validade
 */
export function getValidityStatus(dateExpiration?: string | Date | null): ValidityStatus {
  if (!dateExpiration) return 'OK';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exp = dateExpiration instanceof Date ? dateExpiration : new Date(dateExpiration);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 15) return 'ALERT';
  return 'OK';
}

/**
 * Formata um número para o padrão brasileiro (milhares com ponto, decimais com vírgula)
 * sem o símbolo de moeda.
 * 
 * @param value - Valor numérico ou string
 * @param decimals - Quantidade de casas decimais (padrão: 2)
 * @returns String formatada (ex: 1.234,56)
 */
export function formatNumberBR(value: number | string | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return '';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Converte uma string no formato brasileiro (1.234,56) para um número (1234.56)
 * 
 * @param value - String formatada
 * @returns Número ou 0 se inválido
 */
export function parseNumberBR(value: string): number {
  if (!value) return 0;
  
  // Se contiver vírgula, assume o padrão brasileiro (ponto=milhar, vírgula=decimal)
  if (value.includes(',')) {
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }
  
  // Se não contiver vírgula, mas contiver ponto(s)
  if (value.includes('.')) {
    const parts = value.split('.');
    // Se houver apenas um ponto, tratamos como decimal (facilitando teclado numérico)
    if (parts.length === 2) {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    // Se houver múltiplos pontos, tratamos como separadores de milhar
    const cleanValue = value.replace(/\./g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}


/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata um CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(value: string): string {
  const digits = unmask(value);
  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formata um CPF (000.000.000-00)
 */
export function formatCPF(value: string): string {
  const digits = unmask(value);
  return digits
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/**
 * Formata telefone brasileiro para (00) 0000-0000 ou (00) 00000-0000.
 */
export function formatPhoneBR(value: string): string {
  const digits = unmask(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata um documento (CPF ou CNPJ) com base no tamanho
 */
export function formatDocument(value: string): string {
  const digits = unmask(value);
  if (digits.length <= 11) {
    return formatCPF(digits);
  }
  return formatCNPJ(digits);
}

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

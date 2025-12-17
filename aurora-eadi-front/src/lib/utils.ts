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

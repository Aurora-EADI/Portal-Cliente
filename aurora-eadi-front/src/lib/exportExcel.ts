import * as XLSX from "xlsx";

/**
 * Converte data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:...) para DD/MM/YYYY.
 */
export function parseLocalDate(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.includes("T") ? value.split("T")[0] : value;
  const parts = normalized.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

/**
 * Formata data para uso no nome do arquivo: DDMMYYYY.
 */
export function formatDateForFilename(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  if (!year || !month || !day) return "";
  return `${day.padStart(2, "0")}${month.padStart(2, "0")}${year}`;
}

/**
 * Converte um valor de célula para o tipo correto no Excel:
 * - Se a chave estiver em numericKeys: converte string "1.234,56" ou "1234.56" para number
 * - Se já for number: mantém como number
 * - Se for Date: formata para DD/MM/YYYY
 * - Se for string ISO de data: formata para DD/MM/YYYY
 * - Caso contrário: retorna como string
 */
export function formatCellValue(
  value: unknown,
  key?: string,
  numericKeys?: string[]
): string | number {
  // Chave explicitamente marcada como numérica (pode vir como string do backend)
  if (key && numericKeys?.includes(key)) {
    const raw = String(value ?? "").replace(",", ".");
    const parsed = parseFloat(raw);
    return isNaN(parsed) ? "" : parsed;
  }

  // Já é número: preserva
  if (typeof value === "number") return isNaN(value) ? "" : value;

  // Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toLocaleDateString("pt-BR");
  }

  // String no formato ISO de data
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value) &&
    !isNaN(Date.parse(value))
  ) {
    return parseLocalDate(value);
  }

  return (value as string) ?? "";
}

/**
 * Aplica formato numérico "#,##0.00" nas colunas cujos cabeçalhos
 * estejam na lista numericHeaders.
 */
export function applyNumericFormat(
  worksheet: XLSX.WorkSheet,
  numericHeaders: string[]
): void {
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const numericCols: number[] = [];

  for (let C = range.s.c; C <= range.e.c; C++) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (headerCell && numericHeaders.includes(String(headerCell.v))) {
      numericCols.push(C);
    }
  }

  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    for (const C of numericCols) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && typeof cell.v === "number") cell.z = "#,##0.00";
    }
  }
}

/**
 * Aplica formato numérico "#,##0.00" automaticamente em todas as células
 * com valor numérico (exceto o cabeçalho na linha 0).
 */
export function applyNumericFormatAuto(worksheet: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && typeof cell.v === "number") cell.z = "#,##0.00";
    }
  }
}

/**
 * Ajusta automaticamente a largura das colunas com base no conteúdo.
 */
export function applyAutoWidth(
  worksheet: XLSX.WorkSheet,
  rows: Record<string, unknown>[]
): void {
  worksheet["!cols"] = Object.keys(rows[0] || {}).map((col) => {
    const maxLen = rows.reduce((max, row) => {
      return Math.max(max, String(row[col] ?? "").length);
    }, 0);
    return { wch: Math.min(Math.max(col.length, maxLen) + 2, 50) };
  });
}

"use client";

import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { FaturamentoDetalhado } from "@/services/faturamento/types/type_faturamentoDetalhado";
import { useState } from "react";
import { toast } from "sonner";

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

interface Props<T extends object> {
  data: T[];
  disabled?: boolean;
  dt_entrada_inicio?: string;
  dt_entrada_fim?: string;
  visibleColumns?: ColumnConfig[];
}

export function ExportExcelButton<T extends object>({
  data,
  disabled,
  dt_entrada_inicio,
  dt_entrada_fim,
  visibleColumns,
}: Props<T>) {
  const [isLoading, setIsLoading] = useState(false);

  // Funções auxiliares (mantidas)
  const isDate = (value: unknown): value is Date =>
    value instanceof Date && !isNaN(value.getTime());

  const parseLocalDate = (dateString: string): string => {
    if (!dateString || !dateString.includes("-")) return dateString;

    const parts = dateString.split("T")[0].split("-");
    if (parts.length !== 3) return dateString;

    const [year, month, day] = parts;
    if (!year || !month || !day) return dateString;

    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  };

  const formatDateForFilename = (dateString: string): string => {
    if (!dateString) return "";

    const datePart = dateString.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length !== 3) {
      console.warn("Formato de data inválido:", dateString);
      return "";
    }

    const [year, month, day] = parts;
    if (!year || !month || !day) {
      console.warn("Data incompleta:", dateString);
      return "";
    }

    return `${day.padStart(2, "0")}${month.padStart(2, "0")}${year}`;
  };

  // Função principal agora inclui um delay
  const exportToExcel = async () => {
    if (!data || data.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    // 1. Ativa o estado de loading
    setIsLoading(true);

    try {
      // 2. **PONTO CHAVE:** Introduz um pequeno delay (10ms).
      // Isso libera o thread principal para o React redesenhar o componente
      // e exibir o spinner antes de iniciar o trabalho pesado síncrono.
      await new Promise(resolve => setTimeout(resolve, 10));

      // 3. Início do trabalho pesado (Geração da Planilha)
      // Se houver colunas visíveis especificadas, filtrar apenas essas colunas
      const formatted = data.map((item) => {
        const row: Record<string, any> = {};

        // Se visibleColumns foi fornecido, exportar apenas colunas visíveis
        if (visibleColumns && visibleColumns.length > 0) {
          visibleColumns.forEach((col) => {
            const key = col.id as keyof T;
            const val = item[key];

            if (isDate(val)) {
              row[col.label] = val.toLocaleDateString("pt-BR");
            } else if (
              typeof val === "string" &&
              val.includes("-") &&
              !isNaN(Date.parse(val))
            ) {
              row[col.label] = parseLocalDate(val);
            } else {
              row[col.label] = val ?? "";
            }
          });
        } else {
          // Caso contrário, exportar todas as colunas (comportamento padrão)
          Object.entries(item).forEach(([key, val]) => {
            if (isDate(val)) {
              row[key] = val.toLocaleDateString("pt-BR");
            } else if (
              typeof val === "string" &&
              val.includes("-") &&
              !isNaN(Date.parse(val))
            ) {
              row[key] = parseLocalDate(val);
            } else {
              row[key] = val ?? "";
            }
          });
        }

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(formatted);

      worksheet["!cols"] = Object.keys(formatted[0] || {}).map((col) => {
        // Calcula o tamanho máximo do conteúdo da coluna de forma segura (sem spread operator)
        const maxContentLength = formatted.reduce((max, row) => {
          const cellValue = String(row[col] || "");
          return Math.max(max, cellValue.length);
        }, 0);

        return {
          wch: Math.min(Math.max(col.length, maxContentLength) + 2, 50),
        };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Faturamento");

      let fileName = "faturamento";

      if (dt_entrada_inicio && dt_entrada_fim) {
        const dataInicio = formatDateForFilename(dt_entrada_inicio);
        const dataFim = formatDateForFilename(dt_entrada_fim);

        if (dataInicio && dataFim) {
          fileName += `_${dataInicio}_a_${dataFim}`;
        } else {
          const today = new Date().toISOString().split("T")[0];
          fileName += `_${today.replace(/-/g, "")}`;
        }
      } else {
        const today = new Date().toISOString().split("T")[0];
        fileName += `_${today.replace(/-/g, "")}`;
      }

      // 4. Download da planilha (síncrono)
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      toast.success("Planilha exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast.error("Ocorreu um erro ao gerar a planilha.");
    } finally {
      // 5. Desativa o estado de loading
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={exportToExcel}
      // Desativar se 'disabled' for true, sem dados, ou carregando
      disabled={disabled || !data || data.length === 0 || isLoading}
      className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white 
                 rounded-lg hover:bg-green-700 disabled:bg-gray-300 
                 disabled:cursor-not-allowed transition-colors"
    >
      {/* Conteúdo condicional do botão */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}

      {isLoading ? "Gerando Planilha..." : "Exportar Excel"}
    </button>
  );
}
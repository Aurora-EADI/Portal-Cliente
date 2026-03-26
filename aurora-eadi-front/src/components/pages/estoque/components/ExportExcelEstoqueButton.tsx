"use client";

import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";
import { useState } from "react";
import { toast } from "sonner";
import {
  parseLocalDate,
  formatDateForFilename,
  formatCellValue,
  applyNumericFormat,
  applyAutoWidth,
} from "@/lib/exportExcel";

interface Props {
  data: TypeEstoque[];
  disabled?: boolean;
  dt_inicio?: string;
  dt_fim?: string;
}

const COLUMN_LABELS: Record<keyof TypeEstoque, string> = {
  ano:            "Ano",
  dt_entrada:     "Data Entrada",
  n_lote:         "Nº Lote",
  n_conhecimento: "Conhecimento",
  cliente:        "Cliente",
  status_estoque: "Status",
  n_da:           "Nº DA",
  dta:            "DTA",
  container:      "Container",
  "Saldo_(Vol)":  "Saldo (Vol)",
  "Saldo_Valor_(US$)": "Saldo Valor (US$)",
  valor_cif_total: "CIF Total",
  m3_total:        "M3 Total",
  qtd_container:   "Qtd Container",
};

export function ExportExcelEstoqueButton({ data, disabled, dt_inicio, dt_fim }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const exportToExcel = async () => {
    if (!data || data.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    setIsLoading(true);

    try {
      // Pequeno delay para o React renderizar o spinner antes do trabalho pesado
      await new Promise((resolve) => setTimeout(resolve, 10));

      const NUMERIC_KEYS: (keyof TypeEstoque)[] = ["Saldo_Valor_(US$)", "valor_cif_total"];
      const NUMERIC_HEADERS = ["Saldo Valor (US$)", "CIF Total"];

      const formatted = data.map((item) => {
        const row: Record<string, string | number> = {};

        (Object.keys(COLUMN_LABELS) as (keyof TypeEstoque)[]).forEach((key) => {
          const val = item[key];
          if (key === "dt_entrada") {
            row[COLUMN_LABELS[key]] = parseLocalDate(val as string | null);
          } else {
            row[COLUMN_LABELS[key]] = formatCellValue(val, key, NUMERIC_KEYS as string[]);
          }
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(formatted);

      applyNumericFormat(worksheet, NUMERIC_HEADERS);
      applyAutoWidth(worksheet, formatted);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque");

      let fileName = "estoque_em_processo";

      if (dt_inicio && dt_fim) {
        const inicio = formatDateForFilename(dt_inicio);
        const fim    = formatDateForFilename(dt_fim);
        if (inicio && fim) {
          fileName += `_${inicio}_a_${fim}`;
        }
      } else {
        fileName += `_${new Date().toISOString().split("T")[0].replace(/-/g, "")}`;
      }

      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      toast.success("Planilha exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast.error("Ocorreu um erro ao gerar a planilha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={disabled || !data || data.length === 0 || isLoading}
      className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white
                 rounded-lg hover:bg-green-700 disabled:bg-gray-300
                 disabled:cursor-not-allowed transition-colors text-sm"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isLoading ? "Gerando Planilha..." : "Exportar Excel"}
    </button>
  );
}

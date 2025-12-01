"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

interface Props {
  data: FaturamentoDetalhado[];
  disabled?: boolean;
}

export function ExportExcelButton({ data, disabled }: Props) {
  const isDate = (value: unknown): value is Date =>
    value instanceof Date && !isNaN(value.getTime());

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const formatted = data.map((item) => {
      const row: Record<string, any> = {};

      Object.entries(item).forEach(([key, val]) => {
        if (isDate(val)) {
          row[key] = val.toLocaleDateString("pt-BR");
        } else if (
          typeof val === "string" &&
          val.includes("-") &&
          !isNaN(Date.parse(val))
        ) {
          const d = new Date(val);
          row[key] = isDate(d) ? d.toLocaleDateString("pt-BR") : val;
        } else {
          row[key] = val ?? "";
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(formatted);

    worksheet["!cols"] = Object.keys(formatted[0] || {}).map((col) => ({
      wch: Math.min(
        Math.max(
          col.length,
          ...formatted.map((row) => String(row[col] || "").length)
        ) + 2,
        50
      ),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faturamento");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `faturamento_${today}.xlsx`);
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={disabled || !data || data.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white 
                 rounded-lg hover:bg-green-700 disabled:bg-gray-300 
                 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar Excel
    </button>
  );
}

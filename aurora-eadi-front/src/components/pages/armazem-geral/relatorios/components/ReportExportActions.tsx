"use client";

import { Download, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
  applyNumericFormatAuto, 
  applyAutoWidth, 
  formatCellValue 
} from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";

interface ExportColumn {
  header: string;
  key: string;
}

interface ReportExportActionsProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  title: string;
  subtitle?: string;
}

export function ReportExportActions({
  data,
  columns,
  filename,
  title,
  subtitle,
}: ReportExportActionsProps) {
  const [isExcelLoading, setIsExcelLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleExportExcel = async () => {
    if (!data || data.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    setIsExcelLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeno delay para UI

      const formatted = data.map((item) => {
        const row: Record<string, string | number> = {};
        columns.forEach((col) => {
          row[col.header] = formatCellValue(item[col.key], col.key);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      applyNumericFormatAuto(worksheet);
      applyAutoWidth(worksheet, formatted);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success("Excel gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar Excel.");
    } finally {
      setIsExcelLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    setIsPdfLoading(true);
    try {
      await exportToPdf({
        title,
        subtitle,
        filename,
        columns: columns.map(c => ({ header: c.header, dataKey: c.key })),
        data,
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportExcel}
        disabled={isExcelLoading || isPdfLoading || !data || data.length === 0}
        className="flex items-center gap-2 px-4 py-1 bg-green-600 text-white 
                   rounded-lg hover:bg-green-700 disabled:bg-gray-300 
                   disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {isExcelLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Excel
      </button>

      <button
        onClick={handleExportPdf}
        disabled={isExcelLoading || isPdfLoading || !data || data.length === 0}
        className="flex items-center gap-2 px-4 py-1 bg-red-600 text-white 
                   rounded-lg hover:bg-red-700 disabled:bg-gray-300 
                   disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {isPdfLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        PDF
      </button>
    </div>
  );
}

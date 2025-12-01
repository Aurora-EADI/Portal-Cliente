"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFaturamento } from "@/services/faturamento/faturamentoCutOff";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoCutOff";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

import { FaturamentoFilters } from "./components/filtersFaturamento";
import { FaturamentoTable } from "./components/TableFaturamento";

export function FaturamentoDashboard() {
  const [filters, setFilters] = useState({
    busca: "",
    userId: "",
  });

  const { data, isLoading } = useQuery<FaturamentoDetalhado[]>({
    queryKey: ["faturamento"],
    queryFn: getFaturamento,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      if (filters.busca && !item.cliente.toLowerCase().includes(filters.busca.toLowerCase()))
        return false;

      if (filters.userId && String(item.cidade) !== filters.userId)
        return false;

      return true;
    });
  }, [data, filters]);

  // Função auxiliar para verificar se é uma Data
  const isDate = (value: unknown): value is Date => {
    return value instanceof Date && !isNaN(value.getTime());
  };

  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("Não há dados para exportar");
      return;
    }

    // Formata os dados para o Excel
    const dataFormatada = filteredData.map((item) => {
      const itemFormatado: Record<string, any> = {};
      
      Object.entries(item).forEach(([key, value]) => {
        // Converte datas para formato legível
        if (isDate(value)) {
          itemFormatado[key] = value.toLocaleDateString("pt-BR");
        } else if (typeof value === 'string' && value.includes('-') && !isNaN(Date.parse(value))) {
          // Tenta converter strings de data (formato ISO)
          const date = new Date(value);
          if (isDate(date)) {
            itemFormatado[key] = date.toLocaleDateString("pt-BR");
          } else {
            itemFormatado[key] = value;
          }
        } else {
          itemFormatado[key] = value ?? "";
        }
      });
      
      return itemFormatado;
    });

    // Cria a planilha
    const worksheet = XLSX.utils.json_to_sheet(dataFormatada);
    
    // Ajusta a largura das colunas automaticamente
    const maxWidth = 50;
    const columns = Object.keys(dataFormatada[0] || {});
    worksheet["!cols"] = columns.map((col) => {
      const maxLength = Math.max(
        col.length,
        ...dataFormatada.map((row) => String(row[col] || "").length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });

    // Cria o workbook e adiciona a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faturamento");

    // Gera o arquivo com data no nome
    const dataAtual = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `faturamento_${dataAtual}.xlsx`);
  };

  return (
    <div className="space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatório Detalhado de Faturamento</h1>
          <p className="text-gray-500">Dados Consulta SIAUM base Jan/2025.</p>
        </div>
        
        <button
          onClick={exportToExcel}
          disabled={isLoading || !filteredData || filteredData.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </header>

      <FaturamentoFilters filters={filters} setFilters={setFilters} />

      <FaturamentoTable data={filteredData} isLoading={isLoading} />
    </div>
  );
}
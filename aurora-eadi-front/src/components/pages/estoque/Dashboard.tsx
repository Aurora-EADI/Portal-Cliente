"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { EstoqueFilters, EstoqueFiltersProps } from "./components/filtersEstoque";
import { TableEstoque } from "./components/TableEstoque";
import { getEstoque } from "@/services/estoque/estoque";
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";

export function EstoquePage() {
  const [filters, setFilters] = useState<EstoqueFiltersProps>({
    cliente: [],
    n_lote: "",
    dt_inicio: "",
    dt_fim: "",
  });

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"historico" | "simplificado">("historico");

  const [searchParams, setSearchParams] = useState<{
    dt_inicio: string;
    dt_fim: string;
    n_lote?: string;
    cliente?: string;
    report_type?: "historico" | "simplificado";
  } | null>(null);

  const { data, isLoading } = useQuery<TypeEstoque[]>({
    queryKey: ["estoque", searchParams?.dt_inicio, searchParams?.dt_fim, searchParams?.n_lote, searchParams?.cliente, searchParams?.report_type],
    queryFn: () => {
      if (!searchParams) return Promise.resolve([]);
      return getEstoque(
        searchParams.dt_inicio,
        searchParams.dt_fim,
        searchParams.n_lote,
        searchParams.cliente,
        searchParams.report_type,
      );
    },
    enabled: searchParams !== null,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Unique clients for autocomplete
  const clientesUnicos = useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueMap = new Map<string, { cliente: string }>();
    data.forEach((item) => {
      if (item.cliente) uniqueMap.set(item.cliente, { cliente: item.cliente });
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [data]);

  // Helper to parse numeric strings from the query
  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Frontend filtering by client/lote/status/reportType after data is fetched
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      // Filter by Report Type
      if (reportType === "simplificado" && item.status_estoque !== "Em Estoque") {
        return false;
      }

      const matchCliente =
        filters.cliente.length === 0 ||
        (item.cliente && filters.cliente.includes(item.cliente));
      const matchLote =
        !filters.n_lote ||
        (item.n_lote && item.n_lote.toLowerCase().includes(filters.n_lote.toLowerCase()));
      const matchStatus = !statusFilter || item.status_estoque === statusFilter;

      return matchCliente && matchLote && matchStatus;
    });
  }, [data, filters, statusFilter, reportType]);

  // Metrics (Always based on the filteredData)
  const metricas = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { total: 0, totalContainers: 0, totalSaldoValor: 0, totalSaldoVol: 0 };
    }

    const total = filteredData.length;
    const totalContainers = filteredData.reduce((acc, item) => acc + (Number(item.qtd_container) || 0), 0);
    const totalSaldoValor = filteredData.reduce((acc, item) => acc + parseNumericValue(item["Saldo_Valor_(US$)"]), 0);
    const totalSaldoVol = filteredData.reduce((acc, item) => acc + parseNumericValue(item["Saldo_(Vol)"]), 0);

    return {
      total,
      totalContainers,
      totalSaldoValor,
      totalSaldoVol,
    };
  }, [filteredData]);

  const handleFetch = () => {
    if (filters.dt_fim) {
      setSearchParams({
        dt_inicio: filters.dt_inicio,
        dt_fim: filters.dt_fim,
        n_lote: filters.n_lote || undefined,
        // If multiple clients are selected, the backend currently only supports one via LIKE. 
        // For now, we fetch all for the date range and filter on the frontend for multi-select.
        cliente: undefined, 
        report_type: reportType,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-500">Histórico de Lote e Estoque em processo por período de entrada.</p>
        </div>
      </header>

      <div className="space-y-4">
        <EstoqueFilters
          filters={filters}
          setFilters={setFilters}
          onFetch={handleFetch}
          clientes={clientesUnicos}
          filteredData={filteredData}
          reportType={reportType}
          setReportType={setReportType}
        />

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Total Saldo Valor (Orange) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg text-xl flex items-center justify-center">
              💰
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Saldo Valor</p>
              <p className="text-xl font-bold text-gray-900">
                US$ {metricas.totalSaldoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Card 2: Saldo Total (Vol) (Purple) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg text-xl flex items-center justify-center">
              ⚖️
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo Total (Vol)</p>
              <p className="text-xl font-bold text-gray-900">
                {metricas.totalSaldoVol.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Card 3: Total Container (Green) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg text-xl flex items-center justify-center">
              📦
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Container</p>
              <p className="text-xl font-bold text-gray-900">{metricas.totalContainers}</p>
            </div>
          </div>

          {/* Card 4: Total Geral (Blue) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg text-xl flex items-center justify-center">
              📋
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Geral</p>
              <p className="text-xl font-bold text-gray-900">{metricas.total}</p>
            </div>
          </div>
        </div>

        <TableEstoque data={filteredData} isLoading={isLoading} />
      </div>
    </div>
  );
}

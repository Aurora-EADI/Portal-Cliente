"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { EstoqueFilters, EstoqueFiltersProps } from "./components/filtersEstoque";
import { TableEstoque } from "./components/TableEstoque";
import { getEstoque } from "@/services/estoque/estoque";
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";

export function EstoquePage() {
  const [filters, setFilters] = useState<EstoqueFiltersProps>({
    cliente: "",
    n_lote: "",
    dt_inicio: "",
    dt_fim: "",
  });

  const [searchParams, setSearchParams] = useState<{
    dt_inicio: string;
    dt_fim: string;
    n_lote?: string;
    cliente?: string;
  } | null>(null);

  const { data, isLoading } = useQuery<TypeEstoque[]>({
    queryKey: ["estoque", searchParams?.dt_inicio, searchParams?.dt_fim, searchParams?.n_lote, searchParams?.cliente],
    queryFn: () => {
      if (!searchParams) return Promise.resolve([]);
      return getEstoque(
        searchParams.dt_inicio,
        searchParams.dt_fim,
        searchParams.n_lote,
        searchParams.cliente,
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

  // Frontend filtering by client/lote after data is fetched
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      const matchCliente =
        !filters.cliente ||
        (item.cliente && item.cliente.toLowerCase().includes(filters.cliente.toLowerCase()));
      const matchLote =
        !filters.n_lote ||
        (item.n_lote && item.n_lote.toLowerCase().includes(filters.n_lote.toLowerCase()));
      return matchCliente && matchLote;
    });
  }, [data, filters]);

  // Metrics
  const metricas = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { totalRegistros: 0, totalSaldo: 0, clientesUnicos: 0, lotesUnicos: 0 };
    }
    const totalSaldo = filteredData.reduce((acc, item) => acc + (item.saldo ?? 0), 0);
    const clientesSet = new Set(filteredData.map((i) => i.cliente).filter(Boolean));
    const lotesSet = new Set(filteredData.map((i) => i.n_lote).filter(Boolean));
    return {
      totalRegistros: filteredData.length,
      totalSaldo,
      clientesUnicos: clientesSet.size,
      lotesUnicos: lotesSet.size,
    };
  }, [filteredData]);

  const handleFetch = () => {
    if (filters.dt_inicio && filters.dt_fim) {
      setSearchParams({
        dt_inicio: filters.dt_inicio,
        dt_fim: filters.dt_fim,
        n_lote: filters.n_lote || undefined,
        cliente: filters.cliente || undefined,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque em Processo</h1>
          <p className="text-gray-500">Consulta de mercadorias em estoque por período de entrada.</p>
        </div>
      </header>

      <div className="space-y-4">
        <EstoqueFilters
          filters={filters}
          setFilters={setFilters}
          onFetch={handleFetch}
          clientes={clientesUnicos}
          filteredData={filteredData}
        />

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">📦</div>
            <div>
              <p className="text-sm text-gray-500">Total de Registros</p>
              <p className="text-xl font-bold text-gray-900">{metricas.totalRegistros}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">🏷️</div>
            <div>
              <p className="text-sm text-gray-500">Lotes em Estoque</p>
              <p className="text-xl font-bold text-gray-900">{metricas.lotesUnicos}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">👥</div>
            <div>
              <p className="text-sm text-gray-500">Clientes</p>
              <p className="text-xl font-bold text-gray-900">{metricas.clientesUnicos}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">⚖️</div>
            <div>
              <p className="text-sm text-gray-500">Saldo Total</p>
              <p className="text-xl font-bold text-gray-900">{metricas.totalSaldo.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        <TableEstoque data={filteredData} isLoading={isLoading} />
      </div>
    </div>
  );
}

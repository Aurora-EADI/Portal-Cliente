"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { EstoqueFilters, EstoqueFiltersProps } from "./components/filtersEstoque";
import { TableEstoque } from "./components/TableEstoque";
import { getEstoque } from "@/services/estoque/estoque";
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";

const LOADING_STAGES = [
  { after: 0,  message: 'Consultando dados do estoque...' },
  { after: 15, message: 'A consulta está demorando um pouco. Aguarde...' },
  { after: 35, message: 'Ainda processando. Consultas com períodos longos podem levar até 1 minuto.' },
  { after: 60, message: 'Quase lá! Finalizando a consulta...' },
];

function useLoadingMessage(isLoading: boolean) {
  const [message, setMessage] = useState(LOADING_STAGES[0].message);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!isLoading) {
      setMessage(LOADING_STAGES[0].message);
      return;
    }

    LOADING_STAGES.forEach(({ after, message: msg }) => {
      const t = setTimeout(() => setMessage(msg), after * 1000);
      timers.current.push(t);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [isLoading]);

  return message;
}

interface EstoquePageProps {
  reportType: "historico" | "simplificado";
}

export function EstoquePage({ reportType }: EstoquePageProps) {
  const [filters, setFilters] = useState<EstoqueFiltersProps>({
    cliente: [],
    n_lote: "",
    dt_inicio: "",
    dt_fim: "",
  });

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState<{
    dt_inicio: string;
    dt_fim: string;
    n_lote?: string;
    cliente?: string;
    report_type?: "historico" | "simplificado";
  } | null>(null);

  const { data, isLoading, isError, error } = useQuery<TypeEstoque[], Error>({
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
    retry: false,
  });

  const loadingMessage = useLoadingMessage(isLoading);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters.cliente, filters.n_lote, statusFilter, reportType]);

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
        cliente: undefined, 
        report_type: reportType,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {reportType === "historico" ? "Histórico Lote" : "Inventário Simplificado"}
          </h1>
          <p className="text-gray-500">
            {reportType === "historico"
              ? "Histórico de movimentação de lotes por período."
              : "Estoque em processo — apenas itens com status Em Estoque."}
          </p>
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

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
            <span className="text-red-500 text-xl leading-none mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-red-700">Não foi possível carregar os dados</p>
              <p className="text-sm text-red-600 mt-0.5">
                {(error as any)?.response?.data?.message ??
                  'Tente reduzir o período de busca ou adicionar filtros para diminuir o volume de dados.'}
              </p>
            </div>
          </div>
        )}

        {!isError && (
          <TableEstoque
            data={filteredData}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            reportType={reportType}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFaturamento } from "@/services/faturamento/faturamentoDetalhado";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

import { FaturamentoFilters } from "./components/filtersFaturamento";
import { FaturamentoTable } from "./components/TableFaturamento";
import { ExportExcelButton } from "./components/ExportExcelButton";

export function FaturamentoDashboard() {
  const [filters, setFilters] = useState({
  cliente: "",
  cod_cli: "",
  n_fatura: "",
  n_di: "",
  n_lote: "",
  modalidade_txt: "",
});


  const [hasFetched, setHasFetched] = useState(false);

  const { data, isLoading, refetch } = useQuery<FaturamentoDetalhado[]>({
    queryKey: ["faturamento"],
    queryFn: getFaturamento,
    enabled: false, 
  });

  const handleFetch = async () => {
    setHasFetched(true);
    await refetch();
  };

  const filteredData = useMemo(() => {
  if (!data) return [];

  return data.filter((item) => {
    if (filters.cliente && !item.cliente.toLowerCase().includes(filters.cliente.toLowerCase()))
      return false;

    if (filters.cod_cli && String(item.cod_cli) !== filters.cod_cli)
      return false;

    if (filters.n_fatura && String(item.n_fatura) !== filters.n_fatura)
      return false;

    if (filters.n_di && String(item.n_di) !== filters.n_di)
      return false;

    if (filters.n_lote && String(item.n_lote) !== filters.n_lote)
      return false;

    if (
      filters.modalidade_txt &&
      !item.modalidade_txt.toLowerCase().includes(filters.modalidade_txt.toLowerCase())
    )
      return false;

    return true;
  });
}, [data, filters]);

  return (
    <div className="space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatório Detalhado de Faturamento</h1>
          <p className="text-gray-500">Dados Consulta SIAUM base Jan/2025.</p>
        </div>

        <ExportExcelButton
          data={filteredData}
          disabled={!hasFetched || isLoading}
        />
      </header>

      <FaturamentoFilters
        filters={filters}
        setFilters={setFilters}
        onFetch={handleFetch}
      />

      {hasFetched && (
        <FaturamentoTable data={filteredData} isLoading={isLoading} />
      )}
    </div>
  );
}

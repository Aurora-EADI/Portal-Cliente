"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFaturamento } from "@/services/faturamento/faturamentoCutOff";
import { FaturamentoPost } from "@/services/faturamento/type/type_faturamentoCutOff";

import { FaturamentoFilters } from "./components/filtersFaturamento";
import { FaturamentoTable } from "./components/TableFaturamento";

export function FaturamentoDashboard() {
  const [filters, setFilters] = useState({
    busca: "",
    userId: "",
  });

  const { data, isLoading } = useQuery<FaturamentoPost[]>({
    queryKey: ["faturamento"],
    queryFn: getFaturamento,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      if (filters.busca && !item.title.toLowerCase().includes(filters.busca.toLowerCase()))
        return false;

      if (filters.userId && String(item.userId) !== filters.userId)
        return false;

      return true;
    });
  }, [data, filters]);

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold">Relatório CutOff</h1>
        <p className="text-gray-500">Dados consumidos do JSONPlaceholder.</p>
      </header>

      <FaturamentoFilters filters={filters} setFilters={setFilters} />

      <FaturamentoTable data={filteredData} isLoading={isLoading} />
    </div>
  );
}

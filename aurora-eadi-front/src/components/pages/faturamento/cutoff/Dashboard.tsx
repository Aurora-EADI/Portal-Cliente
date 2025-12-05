"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaturamentoFilters } from "../cutoff/components/filtersFaturamento";
import { FaturamentoTable } from "../cutoff/components/TableFaturamento";
import { getFaturamentoCutOff } from "@/services/faturamento/faturamentoDetalhado";
import { TypeBillingCutOff } from "@/services/faturamento/types/TypeBillingCutOff";
import { ExportExcelButton } from "../cutoff/components/ExportExcelButton";

export interface FiltersProps {
  cliente: string;
  bl_awb: string;
  lote: string;
  container: string;
  dta: string;
  dt_entrada_inicio: string;
  dt_entrada_fim: string;
  n_fatura: string;
  n_di: string;
  n_lote: string;
  MODALIDADE: string[];
  rps: string;
}

export function CutOff() {
  const [filters, setFilters] = useState<FiltersProps>({
    cliente: "",
    bl_awb: "",
    lote: "",
    container: "",
    dta: "",
    dt_entrada_inicio: "",
    dt_entrada_fim: "",
    n_fatura: "",
    n_di: "",
    n_lote: "",
    MODALIDADE: [],
    rps: "",
  });

  const { data, isLoading, refetch } = useQuery<TypeBillingCutOff[]>({
    queryKey: ["faturamentoCutOff"],
    queryFn: () => getFaturamentoCutOff(),
    enabled: false,
  });

  const clientesUnicos = useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniqueMap = new Map<string, { cliente: string }>();

    data.forEach((item) => {
      if (item.CLIENTE) {
        uniqueMap.set(item.CLIENTE, {
          cliente: item.CLIENTE,
        });
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
      a.cliente.localeCompare(b.cliente)
    );
  }, [data]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const parseDate = (value: string | null): Date | null => {
    if (!value) return null;

    const cleaned = value.split("T")[0].split(" ")[0];

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      const [y, m, d] = cleaned.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split("/");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    return null;
  };

  const isDateInRange = (itemDate: string, start: string, end: string) => {
    const date = parseDate(itemDate);
    if (!date) return true;

    const startDate = start ? parseDate(start) : null;
    const endDate = end ? parseDate(end) : null;

    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;

    return true;
  };

  const parseNumericValue = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;

    const cleanValue = String(value)
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');

    return parseFloat(cleanValue) || 0;
  };

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      const matchCliente = !filters.cliente ||
        item.CLIENTE.toLowerCase().includes(filters.cliente.toLowerCase());

      const matchBL = !filters.bl_awb ||
        item["BL_AWB_N"].toLowerCase().includes(filters.bl_awb.toLowerCase());

      const matchLote = !filters.lote ||
        item.LOTE?.toLowerCase().includes(filters.lote.toLowerCase());

      const matchContainer = !filters.container ||
        String(item.CONTAINER)?.includes(filters.container);

      const modalidadesItem = Array.isArray(item.MODALIDADE)
        ? item.MODALIDADE.map(m => m.toLowerCase())
        : (item.MODALIDADE ?? "")
          .toLowerCase()
          .split(",")
          .map(s => s.trim());

      const matchModalidade =
        filters.MODALIDADE.length === 0 ||
        filters.MODALIDADE.some((mod) =>
          modalidadesItem.includes(mod.toLowerCase())
        );

      const matchDTA = !filters.dta ||
        item["N_DTA"]?.toLowerCase().includes(filters.dta.toLowerCase());

      const matchData = isDateInRange(
        item.ENTRADA,
        filters.dt_entrada_inicio,
        filters.dt_entrada_fim
      );

      return matchCliente && matchBL && matchLote &&
        matchContainer && matchModalidade && matchDTA && matchData;
    });
  }, [data, filters]);

  const handleFetch = () => {
    refetch();
  };

  const metricas = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalSubtotal: 0,
        totalISS: 0,
        totalLiquido: 0,
        quantidadeRegistros: 0
      };
    }

    return {
      totalSubtotal: filteredData.reduce((acc, item) =>
        acc + parseNumericValue(item["SUB-TOTAL"]), 0),
      totalISS: filteredData.reduce((acc, item) =>
        acc + parseNumericValue(item["VALOR ISS"]), 0),
      totalLiquido: filteredData.reduce((acc, item) =>
        acc + parseNumericValue(item["VALOR LIQUIDO"]), 0),
      quantidadeRegistros: filteredData.length
    };
  }, [filteredData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturamento CutOff</h1>
          <p className="text-gray-500">Faturamento de corte</p>
        </div>
      </header>

      <div className="space-y-4">
        <FaturamentoFilters
          filters={filters}
          setFilters={setFilters}
          onFetch={handleFetch}
          clientes={clientesUnicos}
          filteredData={filteredData}
        />

        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              💰
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Subtotal</p>
              <p className="text-xl font-bold text-gray-900">
                {formatarMoeda(metricas.totalSubtotal)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              📄
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantidade Registros</p>
              <p className="text-xl font-bold text-gray-900">
                {metricas.quantidadeRegistros}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              📊
            </div>
            <div>
              <p className="text-sm text-gray-500">Total ISS</p>
              <p className="text-xl font-bold text-gray-900">
                {formatarMoeda(metricas.totalISS)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              🔧
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Líquido</p>
              <p className="text-xl font-bold text-gray-900">
                {formatarMoeda(metricas.totalLiquido)}
              </p>
            </div>
          </div>
        </div> */}

        <FaturamentoTable
          data={filteredData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
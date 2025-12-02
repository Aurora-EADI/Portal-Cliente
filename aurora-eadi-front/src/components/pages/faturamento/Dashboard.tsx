"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaturamentoFilters } from "./components/filtersFaturamento";
import { FaturamentoTable } from "./components/TableFaturamento";
import { getFaturamento } from "@/services/faturamento/faturamentoDetalhado";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";
import { ExportExcelButton } from "./components/ExportExcelButton";

export interface FiltersProps {
  cliente: string;
  n_fatura: string;
  n_di: string;
  n_lote: string;
  modalidade_txt: string;
  rps: string;
  dt_fatura_inicio: string;
  dt_fatura_fim: string;
}

export function FaturamentoPage() {
  // Estado dos filtros (ATUALIZADO com campos de data)
  const [filters, setFilters] = useState<FiltersProps>({
    cliente: "",
    n_fatura: "",
    n_di: "",
    n_lote: "",
    modalidade_txt: "",
    rps: "",
    dt_fatura_inicio: "",
    dt_fatura_fim: ""
  });

  const { data, isLoading, refetch } = useQuery<FaturamentoDetalhado[]>({
    queryKey: ["faturamento"],
    queryFn: getFaturamento,
    enabled: false,
  });

  const clientesUnicos = useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniqueMap = new Map();

    data.forEach((item) => {
      if (item.cliente) {
        uniqueMap.set(item.cod_cli, {
          cliente: item.cliente,
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

  // Função auxiliar para converter string de data DD/MM/YYYY para Date
  const parseDate = (value: string | Date | null): Date | null => {
    if (!value) return null;

    // Caso já seja Date
    if (value instanceof Date) return value;

    // Remover milissegundos e horas se existirem
    const cleaned = value.split("T")[0].split(" ")[0];

    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      const [y, m, d] = cleaned.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split("/");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    return null;
  };

  // Função auxiliar para comparar datas
  const isDateInRange = (itemDate: any, start: string, end: string) => {
    const date = parseDate(itemDate);
    if (!date) return true;

    const startDate = start ? parseDate(start) : null;
    const endDate = end ? parseDate(end) : null;

    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;

    return true;
  };

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      const matchCliente = !filters.cliente ||
        item.cliente.toLowerCase().includes(filters.cliente.toLowerCase());

      const matchRps = !filters.rps ||
        item.rps.toLowerCase().includes(filters.rps.toLowerCase());

      const matchFatura = !filters.n_fatura ||
        item.n_fatura.toLowerCase().includes(filters.n_fatura.toLowerCase());

      const matchDI = !filters.n_di ||
        item.n_di?.toLowerCase().includes(filters.n_di.toLowerCase());

      const matchLote = !filters.n_lote ||
        item.n_lote?.toLowerCase().includes(filters.n_lote.toLowerCase());

      const matchModalidade = !filters.modalidade_txt ||
        item.modalidade_txt?.toLowerCase().includes(filters.modalidade_txt.toLowerCase());

      // Filtro de data (assumindo que item.dt_fatura existe)
      const matchData = isDateInRange(
        item.dt_fatura, // Ajuste o nome do campo conforme sua interface
        filters.dt_fatura_inicio,
        filters.dt_fatura_fim
      );

      return matchCliente && matchFatura && matchRps &&
        matchDI && matchLote && matchModalidade && matchData;
    });
  }, [data, filters]);

  const handleFetch = () => {
    refetch();
  };

  // Cálculo das métricas
  const metricas = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalFaturado: 0,
        quantidadeRPS: 0,
        totalISS: 0,
        totalOutrosServicos: 0
      };
    }

    return {
      totalFaturado: filteredData.reduce((acc, item) => acc + (Number(item.valor_fatura) || 0), 0),
      quantidadeRPS: filteredData.filter(item => item.rps).length,
      totalISS: filteredData.reduce((acc, item) => acc + (Number(item.iss_valor) || 0), 0),
      totalOutrosServicos: filteredData.reduce((acc, item) =>
        acc + ((item.quantidade || 0) * (item.valor || 0)), 0
      )
    };
  }, [filteredData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturamento Detalhado</h1>
          <p className="text-gray-500">Faturamento Detalhado por período</p>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              💰
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Faturado</p>
              <p className="text-xl font-bold text-gray-900">{formatarMoeda(metricas.totalFaturado)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              📄
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantidade RPS</p>
              <p className="text-xl font-bold text-gray-900">{metricas.quantidadeRPS}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              📊
            </div>
            <div>
              <p className="text-sm text-gray-500">Total ISS 5%</p>
              <p className="text-xl font-bold text-gray-900">{formatarMoeda(metricas.totalISS)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              🔧
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Outros Serviços</p>
              <p className="text-xl font-bold text-gray-900">{formatarMoeda(metricas.totalOutrosServicos)}</p>
            </div>
          </div>
        </div>

        <FaturamentoTable
          data={filteredData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
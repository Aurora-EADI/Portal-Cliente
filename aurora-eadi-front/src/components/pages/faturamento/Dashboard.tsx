"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaturamentoFilters } from "./components/filtersFaturamento";
import { FaturamentoTable } from "./components/TableFaturamento";
import { getFaturamento } from "@/services/faturamento/faturamentoDetalhado";
import { FaturamentoDetalhado } from "@/services/faturamento/types/type_faturamentoDetalhado";

export interface FiltersProps {
  cliente: string;
  n_fatura: string;
  n_di: string;
  n_lote: string;
  modalidade_txt: string[];
  rps: string;
  dt_fatura_inicio: string;
  dt_fatura_fim: string;
}

export function FaturamentoPage() {
  const [filters, setFilters] = useState<FiltersProps>({
    cliente: "",
    n_fatura: "",
    n_di: "",
    n_lote: "",
    modalidade_txt: [],
    rps: "",
    dt_fatura_inicio: "",
    dt_fatura_fim: ""
  });

  // Armazena os parâmetros da última busca realizada
  const [searchParams, setSearchParams] = useState<{
    dt_inicio: string;
    dt_fim: string;
  } | null>(null);

  // Query só executa quando searchParams não é null
  const { data, isLoading, refetch } = useQuery<FaturamentoDetalhado[]>({
    queryKey: ["faturamento", searchParams?.dt_inicio, searchParams?.dt_fim],
    queryFn: () => {
      if (!searchParams) {
        return Promise.resolve([]);
      }
      return getFaturamento(searchParams.dt_inicio, searchParams.dt_fim);
    },
    enabled: searchParams !== null,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  // Filtragem no frontend (após receber dados da API)
  // Filtragem no frontend (após receber dados da API)
const filteredData = useMemo(() => {
  if (!data) return [];

  return data.filter((item) => {
    const matchCliente = !filters.cliente ||
      (item.cliente && item.cliente.toLowerCase().includes(filters.cliente.toLowerCase()));

    const matchRps = !filters.rps ||
      (item.rps && String(item.rps).toLowerCase().includes(filters.rps.toLowerCase()));

    const matchFatura = !filters.n_fatura ||
      (item.n_fatura && item.n_fatura.toLowerCase().includes(filters.n_fatura.toLowerCase()));

    const matchDI = !filters.n_di ||
      (item.n_di && item.n_di.toLowerCase().includes(filters.n_di.toLowerCase()));

    const matchLote = !filters.n_lote ||
      (item.n_lote && item.n_lote.toLowerCase().includes(filters.n_lote.toLowerCase()));

    const modalidadesItem = Array.isArray(item.modalidade_txt)
      ? item.modalidade_txt.map(m => m.toLowerCase())
      : (item.modalidade_txt ?? "")
        .toLowerCase()
        .split(",")
        .map(s => s.trim());

    const matchModalidade =
      filters.modalidade_txt.length === 0 ||
      filters.modalidade_txt.some((mod) =>
        modalidadesItem.includes(mod.toLowerCase())
      );

    return matchCliente && matchFatura && matchRps &&
      matchDI && matchLote && matchModalidade;
  });
}, [data, filters]);

  // Função chamada SOMENTE quando usuário clica em "Buscar Dados"
  const handleFetch = () => {
    if (filters.dt_fatura_inicio && filters.dt_fatura_fim) {
      setSearchParams({
        dt_inicio: filters.dt_fatura_inicio,
        dt_fim: filters.dt_fatura_fim
      });
    }
  };

  // Função auxiliar para converter valores para número
  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;

    if (typeof value === 'string') {
      const cleaned = value
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.');

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  // Métricas calculadas com base nos dados filtrados
  const metricas = useMemo(() => {
  if (!filteredData || filteredData.length === 0) {
    return {
      totalFaturado: 0,
      quantidadeRPS: 0,
      totalISS: 0,
      totalOutrosServicos: 0
    };
  }

  // Quantidade RPS: conta quantos registros únicos têm RPS preenchido
  const quantidadeRPS = new Set(
    filteredData
      .map(item => item.rps)
      .filter(rps => rps && String(rps).trim() !== "")
  ).size;

  // Criar um Map para armazenar valores únicos por RPS
  const rpsMap = new Map();

  filteredData.forEach(item => {
    const rps = item.rps && String(item.rps).trim() !== "" ? item.rps : null;
    
    // Se o RPS já existe no Map, pula este registro
    if (rps && rpsMap.has(rps)) {
      return;
    }
    
    // Se o RPS é válido, adiciona ao Map
    if (rps) {
      rpsMap.set(rps, {
        valor_fatura: parseNumericValue(item.valor_fatura),
        iss_valor: parseNumericValue(item.iss_valor)
      });
    }
  });

  // Total Faturado: soma dos valores de fatura sem RPS repetidos
  const totalFaturado = Array.from(rpsMap.values()).reduce((acc, item) => {
    return acc + item.valor_fatura;
  }, 0);

  // Total ISS: soma dos valores de ISS sem RPS repetidos
  const totalISS = Array.from(rpsMap.values()).reduce((acc, item) => {
    return acc + item.iss_valor;
  }, 0);

  // Total Outros Serviços: soma (quantidade * valor) de TODOS os registros (inclui RPS repetidos)
  const totalOutrosServicos = filteredData.reduce((acc, item) => {
    const valor = parseNumericValue(item.valor);
    return acc + (valor);
  }, 0);

  return {
    totalFaturado,
    quantidadeRPS,
    totalISS,
    totalOutrosServicos
  };
}, [filteredData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturamento Detalhado</h1>
          <p className="text-gray-500">Faturamento Detalhado por período.</p>
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

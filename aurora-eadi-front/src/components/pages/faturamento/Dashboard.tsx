"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaturamentoFilters } from "./components/filtersFaturamento"; // Seu componente de filtros
import { FaturamentoTable } from "./components/TableFaturamento"; // Seu componente de tabela
import { getFaturamento } from "@/services/faturamento/faturamentoDetalhado";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

export function FaturamentoPage() {
  // Estado dos filtros
  const [filters, setFilters] = useState({
    cliente: "",
    cod_cli: "",
    n_fatura: "",
    n_di: "",
    n_lote: "",
    modalidade_txt: "",
    rps: ""
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

      if (item.cod_cli && item.cliente) {
        uniqueMap.set(item.cod_cli, {
          cod_cli: item.cod_cli,
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

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {

      const matchCliente = !filters.cliente || 
        item.cliente.toLowerCase().includes(filters.cliente.toLowerCase());
      
      const matchCodCli = !filters.cod_cli || 
        item.cod_cli.toLowerCase().includes(filters.cod_cli.toLowerCase());

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

      return matchCliente && matchCodCli && matchFatura && matchRps &&
             matchDI && matchLote && matchModalidade;
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
    quantidadeRPS: filteredData.filter(item => item.rps).length, // Conta quantos registros têm RPS
    totalISS: filteredData.reduce((acc, item) => acc + (Number(item.iss_valor) || 0), 0),
    totalOutrosServicos: filteredData.reduce((acc, item) => 
      acc + ((item.quantidade || 0) * (item.valor || 0)), 0
    )
  };
}, [filteredData]);

  return (
    <div className="space-y-4">

      <FaturamentoFilters
        filters={filters}
        setFilters={setFilters}
        onFetch={handleFetch}
        clientes={clientesUnicos} 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            {/* <Users size={24} /> */}
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Faturado</p>
            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(metricas.totalFaturado)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            {/* <Clock size={24} /> */}
          </div>
          <div>
            <p className="text-sm text-gray-500">Quantidade RPS</p>
            <p className="text-2xl font-bold text-gray-900">{metricas.quantidadeRPS}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            {/* <UserCheck size={24} /> */}
          </div>
          <div>
            <p className="text-sm text-gray-500">Total ISS 5%</p>
            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(metricas.totalISS)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            {/* <UserCheck size={24} /> */}
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Outros Serviços</p>
            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(metricas.totalOutrosServicos)}</p>
          </div>
        </div>
      </div>

      <FaturamentoTable
        data={filteredData}
        isLoading={isLoading}
      />
    </div>
  );
}
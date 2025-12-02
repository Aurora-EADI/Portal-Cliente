"use client";

import { useState, useMemo } from "react";
import React from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Eye, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

interface Props {
  data: FaturamentoDetalhado[];
  isLoading: boolean;
  itemsPerPage?: number;
}

type GroupedData = {
  cliente: string;
  rps: string;
  items: FaturamentoDetalhado[];
};

export function FaturamentoTable({
  data,
  isLoading,
  itemsPerPage = 20,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Formatar valores monetários
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  // Formatar datas
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  // Agrupar dados por Cliente e RPS
  const groupedData = useMemo(() => {
    const groups: { [key: string]: GroupedData } = {};
    
    data.forEach(item => {
      const key = `${item.cliente}_${item.rps}`;
      if (!groups[key]) {
        groups[key] = {
          cliente: item.cliente,
          rps: item.rps,
          items: []
        };
      }
      groups[key].items.push(item);
    });
    
    return Object.entries(groups).map(([key, value]) => ({ key, ...value }));
  }, [data]);

  const totalPages = useMemo(
    () => Math.ceil(groupedData.length / itemsPerPage),
    [groupedData.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedData.slice(start, start + itemsPerPage);
  }, [currentPage, groupedData, itemsPerPage]);

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const skeletonRows = Array.from({ length: itemsPerPage });

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento</CardTitle>
      </CardHeader>

      <CardContent>
        {data.length === 0 && !isLoading && (
          <p className="text-gray-600 text-sm">
            Nenhum dado carregado. Clique em <b>Buscar Dados</b> acima.
          </p>
        )}

        {data.length > 0 && (
          <>
            <div className="overflow-auto rounded border max-h-[70vh]">
              <Table className="text-xs w-full">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="p-2 w-8"></TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Cliente</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">RPS</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Nº Fatura</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Valor Fatura</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Valor Serviços</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Modalidade</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">ISS</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Data Fatura</TableHead>
                    <TableHead className="p-2 whitespace-nowrap font-semibold">Vencimento</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading
                    ? skeletonRows.map((_, idx) => (
                        <TableRow key={idx}>
                          {Array.from({ length: 11 }).map((_, i) => (
                            <TableCell key={i} className="p-2">
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : paginatedData.map((group) => {
                        const isExpanded = expandedRows.has(group.key);
                        const firstItem = group.items[0];
                        
                        return (
                          <React.Fragment key={group.key}>
                            {/* Linha Principal */}
                            <TableRow 
                              className="border-t hover:bg-gray-50 cursor-pointer bg-blue-50"
                              onClick={() => toggleRow(group.key)}
                            >
                              <TableCell className="p-2 text-center">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 inline-block" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline-block" />
                                )}
                              </TableCell>
                              <TableCell className="p-2 font-medium">
                                {group.cliente}
                              </TableCell>
                              <TableCell className="p-2">
                                {group.rps}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap">
                                {firstItem.n_fatura}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap font-semibold">
                                {formatCurrency(firstItem.valor_fatura)}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap">
                                {formatCurrency(firstItem.valor_servicos)}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap">
                                {firstItem.modalidade_txt}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap">
                                {formatCurrency(firstItem.iss_valor)}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap">
                                {formatDate(firstItem.dt_fatura)}
                              </TableCell>
                              <TableCell className="p-2 whitespace-nowrap">
                                {formatDate(firstItem.dt_vencimento)}
                              </TableCell>
                            </TableRow>

                            {/* Seção Expandida com Sub-tabela de Serviços */}
                            {isExpanded && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={11} className="p-0">
                                  <div className="p-4 bg-white border-l-4 border-blue-500">
                                    <h4 className="font-semibold text-sm mb-3 text-gray-700">
                                      Serviços Detalhados
                                    </h4>
                                    <Table className="text-xs">
                                      <TableHeader>
                                        <TableRow className="bg-blue-100">
                                          <TableHead className="p-2 font-semibold">Nome do Serviço</TableHead>
                                          <TableHead className="p-2 font-semibold text-center">Quantidade</TableHead>
                                          <TableHead className="p-2 font-semibold text-right">Valor Unitário</TableHead>
                                          <TableHead className="p-2 font-semibold text-right">Total (Qtd × Valor)</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {group.items.map((item, idx) => {
                                          const quantidade = parseFloat(item.quantidade?.toString() || "0");
                                          const valorUnitario = parseFloat(item.valor?.toString() || "0");
                                          const total = quantidade * valorUnitario;
                                          
                                          return (
                                            <TableRow key={idx} className="hover:bg-gray-50">
                                              <TableCell className="p-2">{item.servico}</TableCell>
                                              <TableCell className="p-2 text-center">{quantidade}</TableCell>
                                              <TableCell className="p-2 text-right">{formatCurrency(valorUnitario)}</TableCell>
                                              <TableCell className="p-2 text-right font-semibold text-blue-600">
                                                {formatCurrency(total)}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                        {/* Linha de Total */}
                                        <TableRow className="bg-blue-50 font-semibold">
                                          <TableCell className="p-2" colSpan={3}>TOTAL GERAL</TableCell>
                                          <TableCell className="p-2 text-right text-blue-700">
                                            {formatCurrency(
                                              group.items.reduce((sum, item) => {
                                                const qtd = parseFloat(item.quantidade?.toString() || "0");
                                                const val = parseFloat(item.valor?.toString() || "0");
                                                return sum + (qtd * val);
                                              }, 0)
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                </TableBody>
              </Table>
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4">
                <button 
                  onClick={handlePrev} 
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  onClick={handleNext} 
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
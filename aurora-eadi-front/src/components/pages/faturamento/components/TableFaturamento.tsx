"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import React from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Settings, GripVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "cliente", label: "Cliente", visible: true, width: 200, minWidth: 100 },
  { id: "rps", label: "RPS", visible: true, width: 120, minWidth: 80 },
  { id: "n_fatura", label: "Nº Fatura", visible: true, width: 120, minWidth: 80 },
  { id: "valor_fatura", label: "Valor Fatura", visible: true, width: 130, minWidth: 100 },
  { id: "valor_servicos", label: "Valor Serviços", visible: true, width: 130, minWidth: 100 },
  { id: "modalidade_txt", label: "Modalidade", visible: true, width: 150, minWidth: 100 },
  { id: "iss_valor", label: "ISS", visible: true, width: 110, minWidth: 80 },
  { id: "dt_fatura", label: "Data Fatura", visible: true, width: 120, minWidth: 100 },
  { id: "dt_vencimento", label: "Vencimento", visible: true, width: 120, minWidth: 100 },
];

export function FaturamentoTable({
  data,
  isLoading,
  itemsPerPage = 20,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeRef = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

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

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleMouseDown = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    resizeRef.current = {
      columnId,
      startX: e.clientX,
      startWidth: column.width,
    };
    setResizingColumn(columnId);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const { columnId, startX, startWidth } = resizeRef.current;
      const column = columns.find(col => col.id === columnId);
      if (!column) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(column.minWidth, startWidth + diff);

      setColumns(prev =>
        prev.map(col =>
          col.id === columnId ? { ...col, width: newWidth } : col
        )
      );
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumn, columns]);

  const getCellValue = (item: FaturamentoDetalhado, columnId: string) => {
    switch (columnId) {
      case "valor_fatura":
      case "valor_servicos":
      case "iss_valor":
        return formatCurrency(item[columnId]);
      case "dt_fatura":
      case "dt_vencimento":
        return formatDate(item[columnId]);
      default:
        return item[columnId as keyof FaturamentoDetalhado];
    }
  };

  const visibleColumns = columns.filter(col => col.visible);
  const skeletonRows = Array.from({ length: itemsPerPage });

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Faturamento</CardTitle>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Exibir Colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.visible}
                onCheckedChange={() => toggleColumnVisibility(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                    <TableHead className="p-2 w-8 sticky left-0 bg-gray-100 z-10"></TableHead>
                    {visibleColumns.map((column) => (
                      <TableHead
                        key={column.id}
                        className="p-2 whitespace-nowrap font-semibold relative group select-none"
                        style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
                      >
                        <div className="flex items-center justify-between pr-2">
                          <span>{column.label}</span>
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 hover:w-1 transition-all z-20"
                            onMouseDown={(e) => handleMouseDown(e, column.id)}
                            style={{
                              backgroundColor: resizingColumn === column.id ? '#3b82f6' : 'transparent',
                              width: resizingColumn === column.id ? '2px' : undefined
                            }}
                            title="Arraste para redimensionar"
                          />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading
                    ? skeletonRows.map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="p-2">
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          {visibleColumns.map((col) => (
                            <TableCell key={col.id} className="p-2">
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
                            <TableRow 
                              className="border-t hover:bg-gray-50 cursor-pointer bg-blue-50"
                              onClick={() => toggleRow(group.key)}
                            >
                              <TableCell className="p-2 text-center sticky left-0 bg-blue-50 z-10">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 inline-block" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline-block" />
                                )}
                              </TableCell>
                              {visibleColumns.map((column) => (
                                <TableCell
                                  key={column.id}
                                  className={`p-2 whitespace-nowrap ${
                                    column.id === 'valor_fatura' ? 'font-semibold' : ''
                                  } ${column.id === 'cliente' ? 'font-medium' : ''}`}
                                  style={{ 
                                    width: `${column.width}px`,
                                    maxWidth: `${column.width}px`,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  title={String(getCellValue(firstItem, column.id))}
                                >
                                  {getCellValue(firstItem, column.id)}
                                </TableCell>
                              ))}
                            </TableRow>

                            {isExpanded && (
                              <TableRow className="bg-gray-50">
                                <TableCell colSpan={visibleColumns.length + 1} className="p-0">
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
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, groupedData.length)} de {groupedData.length} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handlePrev} 
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button 
                    onClick={handleNext} 
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
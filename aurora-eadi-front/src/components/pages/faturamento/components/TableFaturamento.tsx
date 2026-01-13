"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import React from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Settings, Loader2 } from "lucide-react";
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
import { FaturamentoDetalhado } from "@/services/faturamento/types/type_faturamentoDetalhado";

interface Props {
  data: FaturamentoDetalhado[];
  isLoading: boolean;
  itemsPerPage?: number;
  onVisibleColumnsChange?: (columns: ColumnConfig[]) => void;
}

type GroupedData = {
  key: string;
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
  { id: "cod_clie", label: "Cod. Cliente", visible: false, width: 200, minWidth: 100 },
  { id: "n_fatura", label: "Nº Fatura", visible: true, width: 120, minWidth: 80 },
  { id: "cliente", label: "Cliente", visible: true, width: 200, minWidth: 100 },
  { id: "endereco", label: "Endereco", visible: false, width: 200, minWidth: 100 },
  { id: "bairro", label: "Bairro", visible: false, width: 200, minWidth: 100 },
  { id: "cidade", label: "Cidade", visible: false, width: 200, minWidth: 100 },
  { id: "uf", label: "UF", visible: false, width: 110, minWidth: 110 },
  { id: "cep", label: "CEP", visible: false, width: 110, minWidth: 110 },
  { id: "cgc", label: "CGC", visible: false, width: 120, minWidth: 130 },
  { id: "insc_est", label: "Insc. Estadual", visible: false, width: 120, minWidth: 130 },
  { id: "insc_munic", label: "Insc. Municipal", visible: false, width: 120, minWidth: 130 },
  { id: "tp_nota", label: "TP Nota", visible: false, width: 120, minWidth: 130 },
  { id: "vl_extenso", label: "Valor Extenso", visible: false, width: 120, minWidth: 130 },
  { id: "dt_entrada", label: "Data Entrada", visible: false, width: 120, minWidth: 130 },
  { id: "rps", label: "RPS", visible: true, width: 120, minWidth: 80 },
  { id: "valor_fatura", label: "Valor Fatura", visible: true, width: 130, minWidth: 100 },
  { id: "valor_cif", label: "Valor CIF", visible: true, width: 130, minWidth: 100 },
  { id: "valor_servicos", label: "Valor Serviços", visible: true, width: 130, minWidth: 100 },
  { id: "modalidade_txt", label: "Modalidade", visible: true, width: 150, minWidth: 100 },
  { id: "iss_cobrar", label: "ISS Cobrar", visible: false, width: 150, minWidth: 100 },
  { id: "iss_valor", label: "ISS", visible: true, width: 110, minWidth: 80 },
  { id: "iss_percentual", label: "ISS Percentual", visible: false, width: 150, minWidth: 100 },
  { id: "iii_valor", label: "ISS Percentual", visible: false, width: 150, minWidth: 100 },
  { id: "tributacao_msg", label: "Tributação Msg", visible: false, width: 150, minWidth: 100 },
  { id: "observacao", label: "Observação", visible: false, width: 150, minWidth: 100 },
  { id: "despachante", label: "Despachante", visible: false, width: 150, minWidth: 100 },
  { id: "n_di", label: "Nº DI", visible: false, width: 150, minWidth: 100 },
  { id: "n_lote", label: "Nº Lote", visible: true, width: 150, minWidth: 100 },
  { id: "n_conhecimento", label: "Conhecimento", visible: false, width: 150, minWidth: 100 },
  { id: "n_documento", label: "Nº Documento", visible: false, width: 150, minWidth: 100 },
  { id: "tx_dolar", label: "Taxa Dólar", visible: true, width: 150, minWidth: 100 },
  { id: "dt_fatura", label: "Data Fatura", visible: true, width: 120, minWidth: 100 },
  { id: "dt_vencimento", label: "Data Vencimento", visible: true, width: 120, minWidth: 100 },
  { id: "nr_periodo_i", label: "nr_periodo_i", visible: false, width: 120, minWidth: 100 },
  { id: "nr_periodo_f", label: "nr_periodo_f", visible: false, width: 120, minWidth: 100 },
  { id: "dt_periodo_f", label: "dt_periodo_f", visible: false, width: 120, minWidth: 100 },
  { id: "qt_volumes", label: "Volume", visible: false, width: 120, minWidth: 100 },
  { id: "pes_bruto", label: "Peso Bruto", visible: false, width: 120, minWidth: 100 },
  { id: "m3", label: "M3", visible: false, width: 120, minWidth: 100 },
  { id: "servico_id", label: "Servico ID", visible: false, width: 120, minWidth: 100 },
  { id: "quantidade", label: "Quantidade", visible: false, width: 200, minWidth: 100 },
  { id: "valor", label: "Valor", visible: false, width: 200, minWidth: 100 },
  { id: "servico", label: "Serviço", visible: false, width: 200, minWidth: 100 },
];

const SKELETON_ROWS_COUNT = 10;


const formatCurrency = (value: string | number): string => {
  // Remove pontos de milhares e substitui vírgula por ponto se necessário
  let num: number;
  if (typeof value === "string") {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    num = parseFloat(cleaned);
  } else {
    num = value;
  }
  
  // Verifica se é um número válido
  if (isNaN(num)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

const formatDate = (date?: string | null): string => {
  if (!date) return ""; // ou "—"

  const normalized = date.includes("T") ? date.split("T")[0] : date;
  const d = new Date(normalized);

  if (isNaN(d.getTime())) return ""; // evita erro caso seja uma data inválida

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}/${month}/${year}`;
};


const getCellValue = (item: FaturamentoDetalhado, columnId: string, group?: GroupedData): string | number => {
  const fieldName = columnId.replace('col_', '') as keyof FaturamentoDetalhado;

  // Tratamento especial para a coluna "valor" - exibe o total geral do grupo
  if (columnId === "valor" && group) {
    const totalGeral = group.items.reduce((sum, i) => {
      const val = parseFloat(i.valor?.toString() || "0");
      return sum + val;
    }, 0);
    return formatCurrency(totalGeral);
  }

  switch (fieldName) {
    case "valor_fatura":
    case "valor_servicos":
    case "iss_valor":
    case "valor":
      return formatCurrency(item[fieldName]);
    case "dt_fatura":
    case "dt_vencimento":
    case "dt_periodo_f":
    case "dt_entrada":
      return formatDate(item[fieldName]);
    default:
      return item[fieldName];
  }
};

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
const TableSkeletonRow = React.memo(({ visibleColumns }: { visibleColumns: ColumnConfig[] }) => (
  <TableRow className="animate-pulse border-t">
    <TableCell className="p-2 sticky left-0 bg-white z-10">
      <div className="flex justify-center">
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </TableCell>
    {visibleColumns.map((col) => (
      <TableCell key={col.id} className="p-2">
        <Skeleton
          className="h-4 rounded"
          style={{
            width: `${Math.floor(Math.random() * 40 + 50)}%`,
          }}
        />
      </TableCell>
    ))}
  </TableRow>
));

const TableSkeleton = ({ visibleColumns }: { visibleColumns: ColumnConfig[] }) => (
  <>
    {Array.from({ length: SKELETON_ROWS_COUNT }).map((_, idx) => (
      <TableSkeletonRow key={`skeleton-${idx}`} visibleColumns={visibleColumns} />
    ))}
  </>
);

const EmptyState = () => (
  <div className="text-center py-12 border rounded-lg bg-gray-50">
    <div className="text-gray-400 mb-3">
      <svg
        className="mx-auto h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <p className="text-gray-600 text-sm font-medium">Nenhum dado disponível</p>
    <p className="text-gray-500 text-xs mt-1">
      Clique em <b>Buscar Dados</b> para carregar informações
    </p>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4 border rounded-lg bg-gradient-to-b from-blue-50 to-white">
    <div className="relative">
      <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-20" />
    </div>
    <div className="text-center">
      <p className="text-base font-semibold text-gray-800">Carregando dados...</p>
      <p className="text-sm text-gray-500 mt-1">Por favor, aguarde um momento</p>
    </div>
  </div>
);

interface ExpandedRowContentProps {
  group: GroupedData;
  visibleColumnsCount: number;
}

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders quando props não mudam
const ExpandedRowContent = React.memo(({ group, visibleColumnsCount }: ExpandedRowContentProps) => {
  const totalGeral = useMemo(() =>
    group.items.reduce((sum, item) => {
      const val = parseFloat(item.valor?.toString() || "0");
      return sum + (val);
    }, 0),
    [group.items]
  );

  return (
    <TableRow className="bg-gray-50">
      <TableCell colSpan={visibleColumnsCount + 1} className="p-0">
        <div className="p-4 bg-white border-l-4 border-blue-500">
          <h4 className="font-semibold text-sm mb-3 text-gray-700">
            Serviços Detalhados
          </h4>
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-blue-100">
                <TableHead className="p-2 font-semibold">Nome do Serviço</TableHead>
                {/* <TableHead className="p-2 font-semibold text-center">Quantidade</TableHead>
                <TableHead className="p-2 font-semibold text-right">Valor Unitário</TableHead> */}
                <TableHead className="p-2 font-semibold text-right">Total (Qtd × Valor)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.items.map((item, idx) => {
                const valorUnitario = (item.valor?.toString() || "0");

                return (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="p-2">{item.servico}</TableCell>
                    <TableCell className="p-2 text-right font-semibold text-blue-600">
                      {formatCurrency(valorUnitario)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-blue-50 font-semibold">
                <TableCell className="p-2">TOTAL GERAL</TableCell>
                <TableCell className="p-2 text-right text-blue-700">
                  {formatCurrency(totalGeral)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TableCell>
    </TableRow>
  );
});

interface ResizableHeaderProps {
  column: ColumnConfig;
  isResizing: boolean;
  onMouseDown: (e: React.MouseEvent, columnId: string) => void;
}

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
const ResizableHeader = React.memo(({ column, isResizing, onMouseDown }: ResizableHeaderProps) => (
  <TableHead
    className="p-2 whitespace-nowrap font-semibold relative group select-none bg-gray-100"
    style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
  >
    <div className="flex items-center justify-between pr-2">
      <span>{column.label}</span>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 hover:w-1 transition-all z-20"
        onMouseDown={(e) => onMouseDown(e, column.id)}
        style={{
          backgroundColor: isResizing ? '#3b82f6' : 'transparent',
          width: isResizing ? '2px' : undefined
        }}
        title="Arraste para redimensionar"
      />
    </div>
  </TableHead>
));

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

// 🚀 OTIMIZAÇÃO: React.memo previne re-renders desnecessários
const Pagination = React.memo(({ currentPage, totalPages, itemsPerPage, totalItems, onPrev, onNext }: PaginationProps) => (
  <div className="flex justify-between items-center mt-4">
    <div className="text-sm text-gray-600">
      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
    </div>
    <div className="flex items-center gap-2">
      <Button
        onClick={onPrev}
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
        onClick={onNext}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
      >
        Próxima
      </Button>
    </div>
  </div>
));

export function FaturamentoTable({ data, isLoading, itemsPerPage = 20, onVisibleColumnsChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<string | null>(null);

  const resizeRef = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const groupedData = useMemo(() => {
    const groups: { [key: string]: GroupedData } = {};

    data.forEach(item => {
      // Adicione n_fatura e dt_fatura para garantir unicidade
      const key = `${item.cliente}_${item.rps}_${item.n_fatura}_${item.dt_fatura}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          cliente: item.cliente,
          rps: item.rps,
          items: []
        };
      }
      groups[key].items.push(item);
    });

    return Object.values(groups);
  }, [data]);

  const totalPages = useMemo(
    () => Math.ceil(groupedData.length / itemsPerPage),
    [groupedData.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedData.slice(start, start + itemsPerPage);
  }, [currentPage, groupedData, itemsPerPage]);

  const visibleColumns = useMemo(() =>
    columns.filter(col => col.visible),
    [columns]
  );

  // Notifica o componente pai sempre que as colunas visíveis mudarem
  useEffect(() => {
    if (onVisibleColumnsChange) {
      onVisibleColumnsChange(visibleColumns);
    }
  }, [visibleColumns, onVisibleColumnsChange]);

  const toggleRow = useCallback((key: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  const toggleAllColumns = useCallback((checked: boolean) => {
    setColumns(prev =>
      prev.map(col => ({ ...col, visible: checked }))
    );
  }, []);

  const allColumnsVisible = useMemo(() =>
    columns.every(col => col.visible),
    [columns]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string) => {
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
  }, [columns]);

  const handlePrev = useCallback(() =>
    setCurrentPage(prev => Math.max(prev - 1, 1)),
    []
  );

  const handleNext = useCallback(() =>
    setCurrentPage(prev => Math.min(prev + 1, totalPages)),
    [totalPages]
  );

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

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  useEffect(() => {
    if (!isLoading && data.length > 0) {
      const now = new Date();
      setLastSearchTime(now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));
    }
  }, [isLoading, data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Faturamento</CardTitle>

          {lastSearchTime && !isLoading && (
            <span className="text-xs text-gray-500">
              Última consulta: {lastSearchTime}
            </span>
          )}

          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">Carregando...</span>
            </div>
          )}
        </div>

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
            <DropdownMenuCheckboxItem
              checked={allColumnsVisible}
              onCheckedChange={toggleAllColumns}
              onSelect={(e) => e.preventDefault()}
              className="font-semibold"
            >
              Selecionar Todas
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {columns.map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.visible}
                onCheckedChange={() => toggleColumnVisibility(column.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        {!isLoading && data.length === 0 && <EmptyState />}

        {isLoading && data.length === 0 && <LoadingState />}

        {data.length > 0 && (
          <>
            <div className="overflow-auto rounded border max-h-[90vh]">
              <Table className="text-xs w-full">
                <TableHeader className="sticky top-0 z-20"    >
                  <TableRow className="bg-gray-100">
                    <TableHead className="p-2 w-8 sticky left-0 bg-gray-100 z-10"></TableHead>
                    {visibleColumns.map((column) => (
                      <ResizableHeader
                        key={column.id}
                        column={column}
                        isResizing={resizingColumn === column.id}
                        onMouseDown={handleMouseDown}
                      />
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableSkeleton visibleColumns={visibleColumns} />
                  ) : (
                    paginatedData.map((group) => {
                      const isExpanded = expandedRows.has(group.key);
                      const firstItem = group.items[0];

                      return (
                        <React.Fragment key={group.key}>
                          <TableRow
                            className="border-t hover:bg-gray-50 cursor-pointer bg-blue-50 transition-colors"
                            onClick={() => toggleRow(group.key)}
                          >
                            <TableCell className="p-2 text-center sticky left-0 bg-blue-50 z-10">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 inline-block transition-transform" />
                              ) : (
                                <ChevronRight className="w-4 h-4 inline-block transition-transform" />
                              )}
                            </TableCell>
                            {visibleColumns.map((column) => (
                              <TableCell
                                key={column.id}
                                className={`p-2 whitespace-nowrap ${column.id === 'col_valor_fatura' ? 'font-semibold' : ''
                                  } ${column.id === 'col_cliente' ? 'font-medium' : ''}`}
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
                            <ExpandedRowContent
                              group={group}
                              visibleColumnsCount={visibleColumns.length}
                            />
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={groupedData.length}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
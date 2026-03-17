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
import { Settings, Loader2, ChevronRight, ChevronDown } from "lucide-react";
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
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";
import { Pagination } from "@/components/ui/Pagination";
import { formatNumberBR } from "@/lib/utils";

interface Props {
  data: TypeEstoque[];
  isLoading: boolean;
  loadingMessage?: string;
}

type ColumnConfig = {
  id: keyof TypeEstoque;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "ano",            label: "Ano",           visible: false, width: 80,  minWidth: 60  },
  { id: "dt_entrada",     label: "Data Entrada",  visible: true,  width: 120, minWidth: 100 },
  { id: "n_lote",         label: "Nº Lote",        visible: true,  width: 120, minWidth: 100 },
  { id: "n_conhecimento", label: "Conhecimento",   visible: true,  width: 160, minWidth: 100 },
  { id: "cliente",        label: "Cliente",         visible: true,  width: 200, minWidth: 120 },
  { id: "status_estoque", label: "Status",          visible: false, width: 120, minWidth: 100 },
  { id: "n_da",           label: "Nº DA",           visible: true,  width: 130, minWidth: 100 },
  { id: "dta",            label: "DTA",             visible: true,  width: 130, minWidth: 100 },
  { id: "container",      label: "Container",       visible: true, width: 200, minWidth: 120 },
  { id: "Saldo_(Vol)",    label: "Saldo (Vol)",     visible: false,  width: 100, minWidth: 80  },
  { id: "Saldo_Valor_(US$)", label: "Saldo Valor (US$)", visible: false, width: 130, minWidth: 100 },
  { id: "valor_cif_total", label: "CIF Total",      visible: true,  width: 130, minWidth: 100 },
  { id: "m3_total",        label: "M3 Total",       visible: true,  width: 100, minWidth: 80  },
  { id: "qtd_container",   label: "Qtd Container",  visible: true, width: 100, minWidth: 80  },
];

const SKELETON_ROWS = 10;

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

const formatDate = (date?: string | null): string => {
  if (!date) return "";
  const normalized = date.includes("T") ? date.split("T")[0] : date;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  const day   = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year  = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const NUMERIC_COLUMNS: (keyof TypeEstoque)[] = [
  "Saldo_(Vol)",
  "Saldo_Valor_(US$)",
  "valor_cif_total",
  "m3_total",
];

const getCellValue = (item: TypeEstoque, colId: keyof TypeEstoque) => {
  if (colId === "dt_entrada") return formatDate(item.dt_entrada);
  if (NUMERIC_COLUMNS.includes(colId)) {
    return formatNumberBR(parseNumericValue(item[colId]), 2);
  }
  if (colId === "status_estoque") {
    const status = item.status_estoque;
    if (status === "Em Estoque") {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
          Em Estoque
        </span>
      );
    }
    if (status === "Finalizado") {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
          Finalizado
        </span>
      );
    }
    return status;
  }
  const v = item[colId];
  return v === null || v === undefined ? "" : v;
};

const EmptyState = () => (
  <div className="text-center py-12 border rounded-lg bg-gray-50">
    <div className="text-gray-400 mb-3">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    </div>
    <p className="text-gray-600 text-sm font-medium">Nenhum dado disponível</p>
    <p className="text-gray-500 text-xs mt-1">Clique em <b>Buscar Dados</b> para carregar informações</p>
  </div>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4 border rounded-lg bg-gradient-to-b from-blue-50 to-white">
    <div className="relative">
      <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-20" />
    </div>
    <div className="text-center max-w-xs">
      <p className="text-base font-semibold text-gray-800">Buscando dados</p>
      <p className="text-sm text-gray-500 mt-1 transition-all duration-500">{message}</p>
    </div>
  </div>
);


const ResizableHeader = React.memo(({ column, isResizing, onMouseDown, className }: {
  column: ColumnConfig; isResizing?: boolean;
  onMouseDown?: (e: React.MouseEvent, id: string) => void;
  className?: string;
}) => (
  <TableHead
    className={`p-2 whitespace-nowrap font-semibold relative group select-none ${className || "bg-gray-100"}`}
    style={{ width: column.width ? `${column.width}px` : "auto", minWidth: column.minWidth ? `${column.minWidth}px` : "auto" }}
  >
    <div className="flex items-center justify-between pr-2">
      <span>{column.label}</span>
      {onMouseDown && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 transition-all z-20"
          onMouseDown={(e) => onMouseDown(e, String(column.id))}
          style={{ backgroundColor: isResizing ? "#3b82f6" : "transparent" }}
        />
      )}
    </div>
  </TableHead>
));

export function TableEstoque({ data, isLoading, loadingMessage = 'Consultando dados do estoque...' }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const resizeRef = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  // Group data by client
  const groupedData = useMemo(() => {
    const groups = new Map<string, {
      cliente: string;
      saldoVolTotal: number;
      saldoValorTotal: number;
      cifTotal: number;
      m3Total: number;
      items: TypeEstoque[];
    }>();

    data.forEach(item => {
      const cliente = item.cliente || "SEM CLIENTE";
      if (!groups.has(cliente)) {
        groups.set(cliente, {
          cliente,
          saldoVolTotal: 0,
          saldoValorTotal: 0,
          cifTotal: 0,
          m3Total: 0,
          items: []
        });
      }
      const group = groups.get(cliente)!;
      group.items.push(item);
      group.saldoVolTotal += parseNumericValue(item["Saldo_(Vol)"]);
      group.saldoValorTotal += parseNumericValue(item["Saldo_Valor_(US$)"]);
      group.cifTotal += parseNumericValue(item["valor_cif_total"]);
      group.m3Total += parseNumericValue(item["m3_total"]);
    });

    return Array.from(groups.values()).sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [data]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(groupedData.length / limit)), [groupedData.length, limit]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return groupedData.slice(start, start + limit);
  }, [currentPage, groupedData, limit]);

  const toggleColumn = useCallback((id: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setColumns(prev => prev.map(c => ({ ...c, visible: checked })));
  }, []);

  const toggleClient = (cliente: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(cliente)) next.delete(cliente);
      else next.add(cliente);
      return next;
    });
  };

  const allVisible = useMemo(() => columns.every(c => c.visible), [columns]);

  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find(c => c.id === columnId);
    if (!col) return;
    resizeRef.current = { columnId, startX: e.clientX, startWidth: col.width };
    setResizingColumn(columnId);
  }, [columns]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { columnId, startX, startWidth } = resizeRef.current;
      const col = columns.find(c => c.id === columnId);
      if (!col) return;
      const newWidth = Math.max(col.minWidth, startWidth + (e.clientX - startX));
      setColumns(prev => prev.map(c => c.id === columnId ? { ...c, width: newWidth } : c));
    };
    const onUp = () => { resizeRef.current = null; setResizingColumn(null); };
    if (resizingColumn) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumn, columns]);

  useEffect(() => { setCurrentPage(1); }, [data]);

  useEffect(() => {
    if (!isLoading && data.length > 0) {
      setLastSearchTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  }, [isLoading, data]);

  return (
    <Card className="overflow-hidden shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-white border-b py-4">
        <div className="flex items-center gap-3">
          <CardTitle>Estoque</CardTitle>
          {lastSearchTime && !isLoading && (
            <span className="text-xs text-gray-500">Última consulta: {lastSearchTime}</span>
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
              Configurar Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Colunas do Detalhamento</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={allVisible}
              onCheckedChange={toggleAll}
              onSelect={(e) => e.preventDefault()}
              className="font-semibold"
            >
              Exibir Todas
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {columns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.visible}
                onCheckedChange={() => toggleColumn(String(col.id))}
                onSelect={(e) => e.preventDefault()}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0">
        {!isLoading && data.length === 0 && <div className="p-8"><EmptyState /></div>}
        {isLoading && data.length === 0 && <div className="p-8"><LoadingState message={loadingMessage} /></div>}

        {data.length > 0 && (
          <>
            <div className="overflow-auto max-h-[75vh]">
              <Table className="text-sm w-full border-collapse">
                <TableHeader className="sticky top-0 z-30 shadow-sm">
                  <TableRow className="bg-gray-100 border-b">
                    <TableHead className="w-10 p-2 bg-gray-100 sticky left-0 z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]"></TableHead>
                    <TableHead className="p-3 font-bold text-gray-700 bg-gray-100">Cliente</TableHead>
                    <TableHead className="p-3 font-bold text-gray-700 text-right bg-gray-100">Saldo (Vol)</TableHead>
                    <TableHead className="p-3 font-bold text-gray-700 text-right bg-gray-100">Saldo Valor (US$)</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedGroups.map((group, gIdx) => (
                    <React.Fragment key={group.cliente}>
                      {/* Summary Row */}
                      <TableRow 
                        className={`cursor-pointer transition-colors border-b bg-blue-50`}
                        onClick={() => toggleClient(group.cliente)}
                      >
                        <TableCell className="p-3 sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                          {expandedClients.has(group.cliente) ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </TableCell>
                        <TableCell className="p-3 font-medium text-gray-900">{group.cliente}</TableCell>
                        <TableCell className="p-3 text-right font-semibold text-gray-700">
                          {group.saldoVolTotal.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="p-3 text-right font-semibold text-blue-700">
                          US$ {group.saldoValorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>

                      {/* Detailed Lots Section */}
                      {expandedClients.has(group.cliente) && (
                        <TableRow className="bg-gray-50/30">
                          <TableCell colSpan={4} className="p-4 bg-gray-50/30">
                            <div className="rounded-lg border bg-white shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                              <div className="px-4 py-2 border-b bg-blue-50/50 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-blue-700">
                                <span>Detalhamento de Lotes - {group.cliente}</span>
                                <span>{group.items.length} registros</span>
                              </div>
                              <div className="overflow-x-auto max-h-[400px]">
                                <Table className="text-xs w-full">
                                  <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="bg-gray-100/80">
                                      {visibleColumns.map(col => (
                                        <ResizableHeader
                                          key={col.id}
                                          column={col}
                                          isResizing={resizingColumn === col.id}
                                          onMouseDown={handleMouseDown}
                                          className="bg-gray-100"
                                        />
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.items.map((item, idx) => (
                                      <TableRow key={`${gIdx}-${idx}`} className="border-t hover:bg-gray-50 transition-colors">
                                        {visibleColumns.map(col => (
                                          <TableCell
                                            key={col.id}
                                            className="p-2 whitespace-nowrap border-r last:border-r-0"
                                            style={{ width: `${col.width}px`, maxWidth: `${col.width}px`, overflow: "hidden", textOverflow: "ellipsis" }}
                                            title={String(getCellValue(item, col.id))}
                                          >
                                            {getCellValue(item, col.id)}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                  <tfoot>
                                    <TableRow className="border-t-2 border-blue-200 bg-blue-50/70 font-semibold text-xs sticky bottom-0">
                                      {visibleColumns.map(col => {
                                        const subtotalMap: Partial<Record<keyof TypeEstoque, string>> = {
                                          "Saldo_(Vol)": formatNumberBR(group.saldoVolTotal, 2),
                                          "Saldo_Valor_(US$)": `US$ ${formatNumberBR(group.saldoValorTotal, 2)}`,
                                          "valor_cif_total": `US$ ${formatNumberBR(group.cifTotal, 2)}`,
                                          "m3_total": formatNumberBR(group.m3Total, 2),
                                        };
                                        const isFirst = col.id === visibleColumns[0].id;
                                        const subtotal = subtotalMap[col.id];
                                        return (
                                          <TableCell
                                            key={col.id}
                                            className="p-2 whitespace-nowrap border-r last:border-r-0 text-blue-800"
                                            style={{ width: `${col.width}px`, maxWidth: `${col.width}px` }}
                                          >
                                            {isFirst ? "Subtotal" : subtotal ?? ""}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  </tfoot>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {!isLoading && groupedData.length > 0 && (
              <div className="border-t bg-gray-50/50 py-3 px-4">
                <Pagination
                  page={currentPage}
                  total={groupedData.length}
                  limit={limit}
                  onPageChange={setCurrentPage}
                  onLimitChange={(newLimit) => { setLimit(newLimit); setCurrentPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

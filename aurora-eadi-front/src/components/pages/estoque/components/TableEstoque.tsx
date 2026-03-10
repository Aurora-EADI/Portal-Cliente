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
import { Settings, Loader2 } from "lucide-react";
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

interface Props {
  data: TypeEstoque[];
  isLoading: boolean;
  itemsPerPage?: number;
}

type ColumnConfig = {
  id: keyof TypeEstoque;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "dt_entrada",     label: "Data Entrada",  visible: true,  width: 130, minWidth: 100 },
  { id: "n_lote",         label: "Nº Lote",        visible: true,  width: 130, minWidth: 100 },
  { id: "n_documento",    label: "Nº Documento",   visible: true,  width: 150, minWidth: 100 },
  { id: "n_conhecimento", label: "Conhecimento",   visible: true,  width: 160, minWidth: 100 },
  { id: "master",         label: "Master",          visible: false, width: 160, minWidth: 100 },
  { id: "cliente",        label: "Cliente",         visible: true,  width: 220, minWidth: 120 },
  { id: "saldo",          label: "Saldo",           visible: true,  width: 100, minWidth: 80  },
  { id: "n_da",           label: "Nº DA",           visible: false, width: 130, minWidth: 100 },
  { id: "numero",         label: "Localização",     visible: true,  width: 130, minWidth: 100 },
  { id: "filtro",         label: "Filtro",          visible: false, width: 200, minWidth: 100 },
];

const SKELETON_ROWS = 10;

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

const getCellValue = (item: TypeEstoque, colId: keyof TypeEstoque): string | number => {
  if (colId === "dt_entrada") return formatDate(item.dt_entrada);
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

const Pagination = React.memo(({ currentPage, totalPages, itemsPerPage, totalItems, onPrev, onNext }: {
  currentPage: number; totalPages: number; itemsPerPage: number; totalItems: number;
  onPrev: () => void; onNext: () => void;
}) => (
  <div className="flex justify-between items-center mt-4">
    <div className="text-sm text-gray-600">
      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
    </div>
    <div className="flex items-center gap-2">
      <Button onClick={onPrev} disabled={currentPage === 1} variant="outline" size="sm">Anterior</Button>
      <span className="text-sm text-gray-600 px-2">Página {currentPage} de {totalPages}</span>
      <Button onClick={onNext} disabled={currentPage === totalPages} variant="outline" size="sm">Próxima</Button>
    </div>
  </div>
));

const ResizableHeader = React.memo(({ column, isResizing, onMouseDown }: {
  column: ColumnConfig; isResizing: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}) => (
  <TableHead
    className="p-2 whitespace-nowrap font-semibold relative group select-none bg-gray-100"
    style={{ width: `${column.width}px`, minWidth: `${column.minWidth}px` }}
  >
    <div className="flex items-center justify-between pr-2">
      <span>{column.label}</span>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 transition-all z-20"
        onMouseDown={(e) => onMouseDown(e, column.id)}
        style={{ backgroundColor: isResizing ? "#3b82f6" : "transparent" }}
      />
    </div>
  </TableHead>
));

export function TableEstoque({ data, isLoading, itemsPerPage = 20 }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<string | null>(null);
  const resizeRef = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.length / itemsPerPage)), [data.length, itemsPerPage]);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  const toggleColumn = useCallback((id: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setColumns(prev => prev.map(c => ({ ...c, visible: checked })));
  }, []);

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Estoque em Processo</CardTitle>
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
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Exibir Colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={allVisible}
              onCheckedChange={toggleAll}
              onSelect={(e) => e.preventDefault()}
              className="font-semibold"
            >
              Selecionar Todas
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {columns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.visible}
                onCheckedChange={() => toggleColumn(col.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {col.label}
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
                <TableHeader className="sticky top-0 z-20">
                  <TableRow className="bg-gray-100">
                    {visibleColumns.map(col => (
                      <ResizableHeader
                        key={col.id}
                        column={col}
                        isResizing={resizingColumn === col.id}
                        onMouseDown={handleMouseDown}
                      />
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
                      <TableRow key={`sk-${idx}`} className="animate-pulse border-t">
                        {visibleColumns.map(col => (
                          <TableCell key={col.id} className="p-2">
                            <Skeleton className="h-4 rounded" style={{ width: `${Math.floor(Math.random() * 40 + 50)}%` }} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    paginatedData.map((item, idx) => (
                      <TableRow key={idx} className="border-t hover:bg-gray-50 transition-colors">
                        {visibleColumns.map(col => (
                          <TableCell
                            key={col.id}
                            className="p-2 whitespace-nowrap"
                            style={{ width: `${col.width}px`, maxWidth: `${col.width}px`, overflow: "hidden", textOverflow: "ellipsis" }}
                            title={String(getCellValue(item, col.id))}
                          >
                            {getCellValue(item, col.id)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
                onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
                onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

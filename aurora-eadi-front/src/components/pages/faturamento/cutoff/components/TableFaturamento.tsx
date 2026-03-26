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
import { TypeBillingCutOff } from "@/services/faturamento/types/TypeBillingCutOff";
import { Pagination } from "@/components/ui/Pagination";

interface Props {
  data: TypeBillingCutOff[];
  isLoading: boolean;
}

type ColumnConfig = {
  id: keyof TypeBillingCutOff;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "CLIENTE", label: "Cliente", visible: true, width: 200, minWidth: 150 },
  { id: "ENTRADA", label: "Data Entrada", visible: true, width: 120, minWidth: 100 },
  { id: "BL_AWB_N", label: "BL / AWB Nº", visible: true, width: 150, minWidth: 120 },
  { id: "LOTE", label: "Lote", visible: true, width: 120, minWidth: 80 },
  { id: "N_DTA", label: "Nº DTA", visible: true, width: 120, minWidth: 80 },
  { id: "CONTAINER", label: "Container", visible: true, width: 120, minWidth: 80 },
  { id: "MODALIDADE", label: "Modalidade", visible: true, width: 120, minWidth: 100 },
  { id: "CIF_DTA", label: "CIF (R$) DTA", visible: false, width: 120, minWidth: 100 },
  { id: "DTA COBERTURA", label: "DTA Cobertura", visible: false, width: 120, minWidth: 100 },
  { id: "PER", label: "PER", visible: false, width: 80, minWidth: 60 },
  { id: "TAXA DOLAR", label: "Taxa Dólar", visible: false, width: 100, minWidth: 80 },
  { id: "PESO", label: "Peso", visible: false, width: 100, minWidth: 80 },
  { id: "CUBAGEM", label: "Cubagem", visible: false, width: 100, minWidth: 80 },
  { id: "ARMAZENAGEM", label: "Armazenagem", visible: false, width: 120, minWidth: 100 },
  { id: "ABATIMENTO DO VALOR COBRADO ANTECIPADO", label: "ABATIMENTO DO VALOR COBRADO ANTECIPADO", visible: false, width: 120, minWidth: 100 },
  { id: "ADICIONAL PERICULOSIDADE", label: "ADICIONAL PERICULOSIDADE", visible: false, width: 120, minWidth: 100 },
  { id: "ALUGUEL DE CARRETA / CONTAINER", label: "ALUGUEL DE CARRETA / CONTAINER", visible: false, width: 120, minWidth: 100 },
  { id: "ALUGUEL DE CONTAINER", label: "ALUGUEL DE CONTAINER", visible: false, width: 120, minWidth: 100 },
  { id: "ALUGUEL DE VEICULO", label: "ALUGUEL DE VEICULO", visible: false, width: 120, minWidth: 100 },
  { id: "AVERBAÇÃO DE  D.A", label: "AVERBAÇÃO DE  D.A", visible: false, width: 120, minWidth: 100 },
  { id: "CANCELAMENTO DE REGISTRO DTA", label: "CANCELAMENTO DE REGISTRO DTA", visible: false, width: 120, minWidth: 100 },
  { id: "CAPATAZIA-REEMBOLSO DE TX PAGA", label: "CAPATAZIA-REEMBOLSO DE TX PAGA", visible: false, width: 120, minWidth: 100 },
  { id: "CARGA DIFICIL MANUSEIO", label: "CARGA DIFICIL MANUSEIO", visible: false, width: 120, minWidth: 100 },
  { id: "COLETA DO CNTR VAZIO", label: "COLETA DO CNTR VAZIO", visible: false, width: 120, minWidth: 100 },
  { id: "COMPLEMENTO DE FATURAMENTO", label: "COMPLEMENTO DE FATURAMENTO", visible: false, width: 120, minWidth: 100 },
  { id: "CONSUMO DE ENERGIA", label: "CONSUMO DE ENERGIA", visible: false, width: 120, minWidth: 100 },
  { id: "DESCARTE DE EMBALAGEM", label: "DESCARTE DE EMBALAGEM", visible: false, width: 120, minWidth: 100 },
  { id: "DESCONTO", label: "DESCONTO", visible: false, width: 120, minWidth: 100 },
  { id: "DESOVA DE CONTAINER (CONEXOS)", label: "DESOVA DE CONTAINER (CONEXOS)", visible: false, width: 120, minWidth: 100 },
  { id: "DESUNITIZACAO (DESOVA) EXP", label: "DESUNITIZACAO (DESOVA) EXP", visible: false, width: 120, minWidth: 100 },
  { id: "DESUNITIZACAO DE CONTAINER (DESOVA)", label: "DESUNITIZACAO DE CONTAINER (DESOVA)", visible: false, width: 120, minWidth: 100 },
  { id: "DEVOLUCAO DE CONTAINER VAZIO", label: "DEVOLUCAO DE CONTAINER VAZIO", visible: false, width: 120, minWidth: 100 },
  { id: "EMISSAO DE DAT", label: "EMISSAO DE DAT", visible: false, width: 120, minWidth: 100 },
  { id: "EMISSAO DE DTA", label: "EMISSAO DE DTA", visible: false, width: 120, minWidth: 100 },
  { id: "ESTADIA DE VEICULO (DIARIA)", label: "ESTADIA DE VEICULO (DIARIA)", visible: false, width: 120, minWidth: 100 },
  { id: "FORNECIMENTO DE ENERGIA", label: "FORNECIMENTO DE ENERGIA", visible: false, width: 120, minWidth: 100 },
  { id: "FUMIGACAO DE CARGA (PALLETS/CAIXAS)", label: "FUMIGACAO DE CARGA (PALLETS/CAIXAS)", visible: false, width: 120, minWidth: 100 },
  { id: "FUMIGACAO DE CONTAINER (20)", label: "FUMIGACAO DE CONTAINER (20)", visible: false, width: 120, minWidth: 100 },
  { id: "FUMIGACAO DE CONTAINER (40)", label: "FUMIGACAO DE CONTAINER (40)", visible: false, width: 120, minWidth: 100 },
  { id: "GERENCIAMENTO DE RISCO", label: "GERENCIAMENTO DE RISCO", visible: false, width: 120, minWidth: 100 },
  { id: "GRIS", label: "GRIS", visible: false, width: 120, minWidth: 100 },
  { id: "GRIS 2", label: "GRIS 2", visible: false, width: 120, minWidth: 100 },
  { id: "INFRAESTRUTURA PORTUARIA", label: "INFRAESTRUTURA PORTUARIA", visible: false, width: 120, minWidth: 100 },
  { id: "LACRE", label: "LACRE", visible: false, width: 120, minWidth: 100 },
  { id: "LOCAÇÃO ÁREA MERC PERIG./TOX./INFLAM./CORROS.", label: "LOCAÇÃO ÁREA MERC PERIG./TOX./INFLAM./CORROS.", visible: false, width: 120, minWidth: 100 },
  { id: "LOCAÇÃO DE ÁREA - COMPLEMENTO", label: "LOCAÇÃO DE ÁREA - COMPLEMENTO", visible: false, width: 120, minWidth: 100 },
  { id: "LOCAÇÃO DE ÁREA PARA CARGA SOLTA", label: "LOCAÇÃO DE ÁREA PARA CARGA SOLTA", visible: false, width: 120, minWidth: 100 },
  { id: "LOCAÇÃO DE ÁREA PARA CONTÊINER", label: "LOCAÇÃO DE ÁREA PARA CONTÊINER", visible: false, width: 120, minWidth: 100 },
  { id: "LOCACAO DE CONTAINER (TRANSBORDO)", label: "GRIS", visible: false, width: 120, minWidth: 100 },
  { id: "LOCACAO DE ESPACO / CONTAINER", label: "LOCACAO DE ESPACO / CONTAINER", visible: false, width: 120, minWidth: 100 },
  { id: "MANIFESTACAO DA DAT", label: "MANIFESTACAO DA DAT", visible: false, width: 120, minWidth: 100 },
  { id: "MANUSEIO DE CARGA", label: "MANUSEIO DE CARGA", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO  DE CARGA", label: "MOVIMENTACAO  DE CARGA", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTAÇÃO CARGA EXP.", label: "GRIS", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO DE CONTAINER ( EXP)", label: "MOVIMENTACAO DE CONTAINER ( EXP)", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO DE CONTAINER (CONEXOS)", label: "MOVIMENTACAO DE CONTAINER (CONEXOS)", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO DE CONTAINER (IN/OUT)", label: "MOVIMENTACAO DE CONTAINER (IN/OUT)", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO DE CONTAINER (IN/OUT) EXP", label: "MOVIMENTACAO DE CONTAINER (IN/OUT) EXP", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO DE CONTAINER (TRANSBORDO)", label: "MOVIMENTACAO DE CONTAINER (TRANSBORDO)", visible: false, width: 120, minWidth: 100 },
  { id: "MOVIMENTACAO DE CONTAINER IN/OUT ( TRANSBORDO)", label: "MOVIMENTACAO DE CONTAINER IN/OUT ( TRANSBORDO)", visible: false, width: 120, minWidth: 100 },
  { id: "MULTA REFERENTE A PROCESSO", label: "MULTA REFERENTE A PROCESSO", visible: false, width: 120, minWidth: 100 },
  { id: "PERNOITE DE VEICULO", label: "PERNOITE DE VEICULO", visible: false, width: 120, minWidth: 100 },
  { id: "PESAGEM", label: "PESAGEM", visible: false, width: 120, minWidth: 100 },
  { id: "PUXE (CONEXOS)", label: "PUXE (CONEXOS)", visible: false, width: 120, minWidth: 100 },
  { id: "RETORNO DO CAVALO", label: "RETORNO DO CAVALO", visible: false, width: 120, minWidth: 100 },
  { id: "SEGURO TRANSPORTE DE CARGA", label: "SEGURO TRANSPORTE DE CARGA", visible: false, width: 120, minWidth: 100 },
  { id: "SERVICO ADMINISTRATIVO", label: "SERVICO ADMINISTRATIVO", visible: false, width: 120, minWidth: 100 },
  { id: "TARIFA DE AVERBACAO", label: "TARIFA DE AVERBACAO", visible: false, width: 120, minWidth: 100 },
  { id: "TARIFA DE DESPACHANTE", label: "TARIFA DE DESPACHANTE", visible: false, width: 120, minWidth: 100 },
  { id: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL", label: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL", visible: false, width: 120, minWidth: 100 },
  { id: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL EXP", label: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL EXP", visible: false, width: 120, minWidth: 100 },
  { id: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL POR CNTR", label: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL POR CNTR", visible: false, width: 120, minWidth: 100 },
  { id: "TAXA ADMINISTRATIVA", label: "TAXA ADMINISTRATIVA", visible: false, width: 120, minWidth: 100 },
  { id: "TAXA DE ADMINISTRACAO PARA ARM.. DE MEDICAMENTOS", label: "TAXA DE ADMINISTRACAO PARA ARM.. DE MEDICAMENTOS", visible: false, width: 120, minWidth: 100 },
  { id: "TAXA DE CONSIGNACAO POR DA", label: "TAXA DE CONSIGNACAO POR DA", visible: false, width: 120, minWidth: 100 },
  { id: "TAXA DE LACRE", label: "TAXA DE LACRE", visible: false, width: 120, minWidth: 100 },
  { id: "TRANSPORTE DE CARGA/CONTAINER DTA", label: "TRANSPORTE DE CARGA/CONTAINER DTA", visible: false, width: 120, minWidth: 100 },
  { id: "TRANSPORTE DE CARGA/CONTAINER EXP", label: "TRANSPORTE DE CARGA/CONTAINER EXP", visible: false, width: 120, minWidth: 100 },
  { id: "TRANSPORTE DE CARGA/CONTAINER/ DI", label: "TRANSPORTE DE CARGA/CONTAINER/ DI", visible: false, width: 120, minWidth: 100 },
  { id: "TRANSPORTE DE CARGAS ESPECIAIS", label: "TRANSPORTE DE CARGAS ESPECIAIS", visible: false, width: 120, minWidth: 100 },
  { id: "TRANSPORTE INTERNO  DE CONTAINER", label: "TRANSPORTE INTERNO  DE CONTAINER", visible: false, width: 120, minWidth: 100 },
  { id: "TROCA DE PALLET", label: "TROCA DE PALLET", visible: false, width: 120, minWidth: 100 },
  { id: "UNITIZACAO / OVA", label: "UNITIZACAO / OVA", visible: false, width: 120, minWidth: 100 },
  { id: "UNITIZACAO DE CONTAINER (OVA/TRANSBORDO)", label: "UNITIZACAO DE CONTAINER (OVA/TRANSBORDO)", visible: false, width: 120, minWidth: 100 },
  { id: "SUB-TOTAL", label: "Sub-Total", visible: true, width: 120, minWidth: 100 },
  { id: "VALOR ISS", label: "Valor ISS", visible: true, width: 120, minWidth: 100 },
  { id: "VALOR LIQUIDO", label: "Valor Líquido", visible: true, width: 140, minWidth: 120 },
];

const SKELETON_ROWS_COUNT = 10;

const formatCurrency = (value: string | number): string => {
  if (!value || value === '' || value === '0' || value === 0) return "R$ 0,00";

  const cleanValue = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
  const num = parseFloat(cleanValue);

  if (isNaN(num)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

const formatDate = (date: string): string => {
  // Garante que a data seja interpretada como local, não UTC
  const d = new Date(date.includes('T') ? date.split('T')[0] : date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const getCellValue = (item: TypeBillingCutOff, columnId: keyof TypeBillingCutOff): string => {
  const value = item[columnId];

  const currencyColumns: (keyof TypeBillingCutOff)[] = [
    "CIF_DTA", "SUB-TOTAL", "VALOR ISS", "VALOR LIQUIDO",
    "ARMAZENAGEM", "TAXA DOLAR"
  ];

  const dateColumns: (keyof TypeBillingCutOff)[] = ["ENTRADA", "DTA COBERTURA"];

  if (currencyColumns.includes(columnId)) {
    return formatCurrency(value);
  }

  if (dateColumns.includes(columnId)) {
    return formatDate(String(value || ""));
  }

  if (columnId === "CONTAINER" || columnId === "PER") {
    return String(value || "0");
  }

  return String(value || "");
};

const TableSkeletonRow = ({ visibleColumns }: { visibleColumns: ColumnConfig[] }) => (
  <TableRow className="animate-pulse border-t">
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
);

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

interface ResizableHeaderProps {
  column: ColumnConfig;
  isResizing: boolean;
  onMouseDown: (e: React.MouseEvent, columnId: keyof TypeBillingCutOff) => void;
}

const ResizableHeader = ({ column, isResizing, onMouseDown }: ResizableHeaderProps) => (
  <TableHead
    className="p-2 whitespace-nowrap font-semibold relative group select-none"
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
);


export function FaturamentoTable({ data, isLoading }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<keyof TypeBillingCutOff | null>(null);
    const [lastSearchTime, setLastSearchTime] = useState<string | null>(null);

  const resizeRef = useRef<{
    columnId: keyof TypeBillingCutOff;
    startX: number;
    startWidth: number
  } | null>(null);

  const totalPages = useMemo(
    () => Math.ceil(data.length / limit),
    [data.length, limit]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return data.slice(start, start + limit);
  }, [currentPage, data, limit]);

  const visibleColumns = useMemo(() =>
    columns.filter(col => col.visible),
    [columns]
  );

  const toggleColumnVisibility = useCallback((columnId: keyof TypeBillingCutOff) => {
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

  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: keyof TypeBillingCutOff) => {
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
              Colunas ({visibleColumns.length}/{columns.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
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
            <div className="overflow-auto rounded border max-h-[70vh]">
              <Table className="text-xs w-full">
                <TableHeader>
                  <TableRow className="bg-gray-100">
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
                    paginatedData.map((item, index) => (
                      <TableRow
                        key={`${item.CLIENTE}-${item["BL_AWB_N"]}-${index}`}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        {visibleColumns.map((column) => (
                          <TableCell
                            key={column.id}
                            className={`p-2 whitespace-nowrap ${['SUB-TOTAL', 'VALOR ISS', 'VALOR LIQUIDO'].includes(column.id)
                              ? 'font-semibold'
                              : ''
                              } ${column.id === 'CLIENTE' ? 'font-medium' : ''}`}
                            style={{
                              width: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={getCellValue(item, column.id)}
                          >
                            {getCellValue(item, column.id)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && data.length > 0 && (
              <div className="border-t bg-gray-50/50 py-3 px-4">
                <Pagination
                  page={currentPage}
                  total={data.length}
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

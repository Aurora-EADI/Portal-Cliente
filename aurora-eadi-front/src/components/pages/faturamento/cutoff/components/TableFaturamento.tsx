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
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

interface Props {
  data: FaturamentoDetalhado[];
  isLoading: boolean;
  itemsPerPage?: number;
}

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "CLIENTE", label: "CLIENTE", visible: false, width: 120, minWidth: 80 },
  { id: "ENTRADA", label: "ENTRADA", visible: false, width: 120, minWidth: 80 },
  { id: "BL_AWB_Nº", label: "BL / AWB Nº", visible: false, width: 120, minWidth: 80 },
  { id: "LOTE", label: "LOTE", visible: false, width: 120, minWidth: 80 },
  { id: "Nº_DTA", label: "Nº DTA", visible: false, width: 120, minWidth: 80 },
  { id: "CONTAINER", label: "CONTAINER", visible: false, width: 120, minWidth: 80 },
  { id: "MODALIDADE", label: "MODALIDADE", visible: false, width: 120, minWidth: 80 },
  { id: "CIF_R$_DTA", label: "CIF (R$) DTA", visible: false, width: 120, minWidth: 80 },
  { id: "DTA_COBERTURA", label: "DTA COBERTURA", visible: false, width: 120, minWidth: 80 },
  { id: "PER", label: "PER", visible: false, width: 120, minWidth: 80 },
  { id: "TAXA_DOLAR", label: "TAXA DOLAR", visible: false, width: 120, minWidth: 80 },
  { id: "PESO", label: "PESO", visible: false, width: 120, minWidth: 80 },
  { id: "CUBAGEM", label: "CUBAGEM", visible: false, width: 120, minWidth: 80 },
  { id: "ARMAZENAGEM", label: "ARMAZENAGEM", visible: false, width: 120, minWidth: 80 },
  { id: "ABATIMENTO_DO_VALOR_COBRADO_ANTECIPADO", label: "ABATIMENTO DO VALOR COBRADO ANTECIPADO", visible: false, width: 120, minWidth: 80 },
  { id: "ADICIONAL_DE_VISTORIA_RECEITA_FEDERAL", label: "ADICIONAL DE VISTORIA RECEITA FEDERAL", visible: false, width: 120, minWidth: 80 },
  { id: "ADICIONAL_PERICULOSIDADE", label: "ADICIONAL PERICULOSIDADE", visible: false, width: 120, minWidth: 80 },
  { id: "ALUGUEL_DE_CARRETA_CONTAINER", label: "ALUGUEL DE CARRETA / CONTAINER", visible: false, width: 120, minWidth: 80 },
  { id: "ALUGUEL_DE_CONTAINER", label: "ALUGUEL DE CONTAINER", visible: false, width: 120, minWidth: 80 },
  { id: "ALUGUEL_DE_VEICULO", label: "ALUGUEL DE VEICULO", visible: false, width: 120, minWidth: 80 },
  { id: "AVERBACAO_DE_DA", label: "AVERBAÇÃO DE  D.A", visible: false, width: 120, minWidth: 80 },
  { id: "CANCELAMENTO_DE_REGISTRO_DTA", label: "CANCELAMENTO DE REGISTRO DTA", visible: false, width: 120, minWidth: 80 },
  { id: "CAPATAZIA_REEMBOLSO_DE_TX_PAGA", label: "CAPATAZIA-REEMBOLSO DE TX PAGA", visible: false, width: 120, minWidth: 80 },
  { id: "CARGA_DIFICIL_MANUSEIO", label: "CARGA DIFICIL MANUSEIO", visible: false, width: 120, minWidth: 80 },
  { id: "COLETA_DO_CNTR_VAZIO", label: "COLETA DO CNTR VAZIO", visible: false, width: 120, minWidth: 80 },
  { id: "COMPLEMENTO_DE_FATURAMENTO", label: "COMPLEMENTO DE FATURAMENTO", visible: false, width: 120, minWidth: 80 },
  { id: "CONSUMO_DE_ENERGIA", label: "CONSUMO DE ENERGIA", visible: false, width: 120, minWidth: 80 },
  { id: "DESCARTE_DE_EMBALAGEM", label: "DESCARTE DE EMBALAGEM", visible: false, width: 120, minWidth: 80 },
  { id: "DESCONTO", label: "DESCONTO", visible: false, width: 120, minWidth: 80 },
  { id: "DESOVA_DE_CONTAINER_CONEXOS", label: "DESOVA DE CONTAINER (CONEXOS)", visible: false, width: 120, minWidth: 80 },
  { id: "DESUNITIZACAO_DESOVA_EXP", label: "DESUNITIZACAO (DESOVA) EXP", visible: false, width: 120, minWidth: 80 },
  { id: "DESUNITIZACAO_DE_CONTAINER_DESOVA", label: "DESUNITIZACAO DE CONTAINER (DESOVA)", visible: false, width: 120, minWidth: 80 },
  { id: "DESUNITIZACAO_DE_CONTAINER_DESOVA_TRANSBORDO", label: "DESUNITIZACAO DE CONTAINER (DESOVA/TRANSBORDO)", visible: false, width: 120, minWidth: 80 },
  { id: "DEVOLUCAO_DE_CONTAINER_VAZIO", label: "DEVOLUCAO DE CONTAINER VAZIO", visible: false, width: 120, minWidth: 80 },
  { id: "EMISSAO_DE_DAT", label: "EMISSAO DE DAT", visible: false, width: 120, minWidth: 80 },
  { id: "EMISSAO_DE_DTA", label: "EMISSAO DE DTA", visible: false, width: 120, minWidth: 80 },
  { id: "ESTADIA_DE_VEICULO_DIARIA", label: "ESTADIA DE VEICULO (DIARIA)", visible: false, width: 120, minWidth: 80 },
  { id: "FORNECIMENTO_DE_ENERGIA", label: "FORNECIMENTO DE ENERGIA", visible: false, width: 120, minWidth: 80 },
  { id: "FUMIGACAO_DE_CARGA_PALLETS_CAIXAS", label: "FUMIGACAO DE CARGA (PALLETS/CAIXAS)", visible: false, width: 120, minWidth: 80 },
  { id: "FUMIGACAO_DE_CONTAINER_20", label: "FUMIGACAO DE CONTAINER (20)", visible: false, width: 120, minWidth: 80 },
  { id: "FUMIGACAO_DE_CONTAINER_40", label: "FUMIGACAO DE CONTAINER (40)", visible: false, width: 120, minWidth: 80 },
  { id: "GERENCIAMENTO_DE_RISCO", label: "GERENCIAMENTO DE RISCO", visible: false, width: 120, minWidth: 80 },
  { id: "GRIS", label: "GRIS", visible: false, width: 120, minWidth: 80 },
  { id: "GRIS_2", label: "GRIS 2", visible: false, width: 120, minWidth: 80 },
  { id: "INFRAESTRUTURA_PORTUARIA", label: "INFRAESTRUTURA PORTUARIA", visible: false, width: 120, minWidth: 80 },
  { id: "LACRE", label: "LACRE", visible: false, width: 120, minWidth: 80 },
  { id: "LOCACAO_AREA_MERC_PERIG_TOX_INFLAM_CORROS", label: "LOCAÇÃO ÁREA MERC PERIG./TOX./INFLAM./CORROS.", visible: false, width: 120, minWidth: 80 },
  { id: "LOCACAO_DE_AREA_COMPLEMENTO", label: "LOCAÇÃO DE ÁREA - COMPLEMENTO", visible: false, width: 120, minWidth: 80 },
  { id: "LOCACAO_DE_AREA_PARA_CARGA_SOLTA", label: "LOCAÇÃO DE ÁREA PARA CARGA SOLTA", visible: false, width: 120, minWidth: 80 },
  { id: "LOCACAO_DE_AREA_PARA_CONTAINER", label: "LOCAÇÃO DE ÁREA PARA CONTÊINER", visible: false, width: 120, minWidth: 80 },
  { id: "LOCACAO_DE_CONTAINER_TRANSBORDO", label: "LOCACAO DE CONTAINER (TRANSBORDO)", visible: false, width: 120, minWidth: 80 },
  { id: "LOCACAO_DE_ESPACO_CONTAINER", label: "LOCACAO DE ESPACO / CONTAINER", visible: false, width: 120, minWidth: 80 },
  { id: "MANIFESTACAO_DA_DAT", label: "MANIFESTACAO DA DAT", visible: false, width: 120, minWidth: 80 },
  { id: "MANUSEIO_DE_CARGA", label: "MANUSEIO DE CARGA", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CARGA", label: "MOVIMENTACAO  DE CARGA", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_CARGA_EXP", label: "MOVIMENTAÇÃO CARGA EXP.", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CONTAINER_EXP", label: "MOVIMENTACAO DE CONTAINER ( EXP)", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CONTAINER_CONEXOS", label: "MOVIMENTACAO DE CONTAINER (CONEXOS)", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CONTAINER_IN_OUT", label: "MOVIMENTACAO DE CONTAINER (IN/OUT)", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CONTAINER_IN_OUT_EXP", label: "MOVIMENTACAO DE CONTAINER (IN/OUT) EXP", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CONTAINER_TRANSBORDO", label: "MOVIMENTACAO DE CONTAINER (TRANSBORDO)", visible: false, width: 120, minWidth: 80 },
  { id: "MOVIMENTACAO_DE_CONTAINER_IN_OUT_TRANSBORDO", label: "MOVIMENTACAO DE CONTAINER IN/OUT ( TRANSBORDO)", visible: false, width: 120, minWidth: 80 },
  { id: "MULTA_REFERENTE_A_PROCESSO", label: "MULTA REFERENTE A PROCESSO", visible: false, width: 120, minWidth: 80 },
  { id: "PERNOITE_DE_VEICULO", label: "PERNOITE DE VEICULO", visible: false, width: 120, minWidth: 80 },
  { id: "PESAGEM", label: "PESAGEM", visible: false, width: 120, minWidth: 80 },
  { id: "PUXE_CONEXOS", label: "PUXE (CONEXOS)", visible: false, width: 120, minWidth: 80 },
  { id: "RETORNO_DO_CAVALO", label: "RETORNO DO CAVALO", visible: false, width: 120, minWidth: 80 },
  { id: "SEGURO_TRANSPORTE_DE_CARGA", label: "SEGURO TRANSPORTE DE CARGA", visible: false, width: 120, minWidth: 80 },
  { id: "SERVICO_ADMINISTRATIVO", label: "SERVICO ADMINISTRATIVO", visible: false, width: 120, minWidth: 80 },
  { id: "TARIFA_DE_AVERBACAO", label: "TARIFA DE AVERBACAO", visible: false, width: 120, minWidth: 80 },
  { id: "TARIFA_DE_DESPACHANTE", label: "TARIFA DE DESPACHANTE", visible: false, width: 120, minWidth: 80 },
  { id: "TARIFA_MINIMA_DE_EMISSAO_DE_NOTA_FISCAL", label: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL", visible: false, width: 120, minWidth: 80 },
  { id: "TARIFA_MINIMA_DE_EMISSAO_DE_NOTA_FISCAL_EXP", label: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL EXP", visible: false, width: 120, minWidth: 80 },
  { id: "TARIFA_MINIMA_DE_EMISSAO_DE_NOTA_FISCAL_POR_CNTR", label: "TARIFA MINIMA DE EMISSAO DE NOTA FISCAL POR CNTR", visible: false, width: 120, minWidth: 80 },
  { id: "TAXA_ADMINISTRATIVA", label: "TAXA ADMINISTRATIVA", visible: false, width: 120, minWidth: 80 },
  { id: "TAXA_DE_ADMINISTRACAO_PARA_ARM_DE_MEDICAMENTOS", label: "TAXA DE ADMINISTRACAO PARA ARM.. DE MEDICAMENTOS", visible: false, width: 120, minWidth: 80 },
  { id: "TAXA_DE_CONSIGNACAO_POR_DA", label: "TAXA DE CONSIGNACAO POR DA", visible: false, width: 120, minWidth: 80 },
  { id: "TAXA_DE_LACRE", label: "TAXA DE LACRE", visible: false, width: 120, minWidth: 80 },
  { id: "TRANSPORTE_DE_CARGA_CONTAINER_DTA", label: "TRANSPORTE DE CARGA/CONTAINER DTA", visible: false, width: 120, minWidth: 80 },
  { id: "TRANSPORTE_DE_CARGA_CONTAINER_EXP", label: "TRANSPORTE DE CARGA/CONTAINER EXP", visible: false, width: 120, minWidth: 80 },
  { id: "TRANSPORTE_DE_CARGA_CONTAINER_DI", label: "TRANSPORTE DE CARGA/CONTAINER/ DI", visible: false, width: 120, minWidth: 80 },
  { id: "TRANSPORTE_DE_CARGAS_ESPECIAIS", label: "TRANSPORTE DE CARGAS ESPECIAIS", visible: false, width: 120, minWidth: 80 },
  { id: "TRANSPORTE_INTERNO_DE_CONTAINER", label: "TRANSPORTE INTERNO  DE CONTAINER", visible: false, width: 120, minWidth: 80 },
  { id: "TROCA_DE_PALLET", label: "TROCA DE PALLET", visible: false, width: 120, minWidth: 80 },
  { id: "UNITIZACAO_OVA", label: "UNITIZACAO / OVA", visible: false, width: 120, minWidth: 80 },
  { id: "UNITIZACAO_DE_CONTAINER_OVA_TRANSBORDO", label: "UNITIZACAO DE CONTAINER (OVA/TRANSBORDO)", visible: false, width: 120, minWidth: 80 },
  { id: "SUB_TOTAL", label: "SUB-TOTAL", visible: false, width: 120, minWidth: 80 },
  { id: "VALOR_ISS", label: "VALOR ISS", visible: false, width: 120, minWidth: 80 },
  { id: "VALOR_LIQUIDO", label: "VALOR LÍQUIDO", visible: false, width: 120, minWidth: 80 }
];

const SKELETON_ROWS_COUNT = 10;

const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

const formatDate = (date: string): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR");
};

const getCellValue = (item: FaturamentoDetalhado, columnId: string): string | number => {
  const value = item[columnId as keyof FaturamentoDetalhado];
  
  switch (columnId) {
    case "valor_fatura":
    case "valor_servicos":
    case "valor_cif":
    case "iss_valor":
    case "iii_valor":
    case "valor":
      return value ? formatCurrency(value) : "R$ 0,00";
    case "dt_fatura":
    case "dt_vencimento":
    case "dt_entrada":
    case "dt_periodo_f":
      return value ? formatDate(value as string) : "";
    case "quantidade":
    case "qt_volumes":
    case "pes_bruto":
    case "m3":
      return value || "0";
    default:
      return value || "";
  }
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
  onMouseDown: (e: React.MouseEvent, columnId: string) => void;
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

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

const Pagination = ({ currentPage, totalPages, itemsPerPage, totalItems, onPrev, onNext }: PaginationProps) => (
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
);

export function FaturamentoTable({ data, isLoading, itemsPerPage = 20 }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  
  const resizeRef = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const totalPages = useMemo(
    () => Math.ceil(data.length / itemsPerPage),
    [data.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible),
    [columns]
  );

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Faturamento</CardTitle>
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
          <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Exibir Colunas</DropdownMenuLabel>
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
                        key={`${item.n_fatura}-${item.rps}-${index}`}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        {visibleColumns.map((column) => (
                          <TableCell
                            key={column.id}
                            className={`p-2 whitespace-nowrap ${
                              ['valor_fatura', 'valor_servicos'].includes(column.id) ? 'font-semibold' : ''
                            } ${column.id === 'cliente' ? 'font-medium' : ''}`}
                            style={{ 
                              width: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={String(getCellValue(item, column.id))}
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

            {!isLoading && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
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
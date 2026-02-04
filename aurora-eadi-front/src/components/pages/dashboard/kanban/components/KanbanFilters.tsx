"use client";

import { KanbanFilters as KanbanFiltersType, ContainerType, ContainerStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Search,
  Filter,
  X,
  Tv,
  Minimize2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanFiltersProps {
  filters: KanbanFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<KanbanFiltersType>>;
  companies: string[];
  documentos: string[];
  entradas: string[];
  onReset: () => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  onRefresh: () => void;
  totalContainers: number;
  isRefreshing?: boolean;
}

export function KanbanFilters({
  filters,
  setFilters,
  companies,
  documentos,
  entradas,
  onReset,
  isTvMode,
  onToggleTvMode,
  onRefresh,
  totalContainers,
  isRefreshing = false
}: KanbanFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.entryNumbers.length > 0 ||
    filters.documento ||
    filters.containerType ||
    filters.status ||
    filters.company ||
    filters.dateFrom ||
    filters.dateTo;

  const entryOptions = entradas.map((entry) => ({
    value: entry,
    label: entry,
  }));

  const statusLabels: Record<ContainerStatus, string> = {
    [ContainerStatus.FULL]: "Cheio",
    [ContainerStatus.IN_PROCESS]: "Processando",
    [ContainerStatus.EMPTY]: "Liberado",
  };

  const handleFilterChange = (key: keyof KanbanFiltersType, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 shadow-sm p-4",
      isTvMode && "p-6"
    )}>
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="text-xs text-gray-500 mb-1.5 block">
            Buscar Container / Placa
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="MSKU1234567, ABC-1234..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className={cn(
                "pl-9",
                isTvMode && "h-12 text-lg"
              )}
            />
          </div>
        </div>

        {/* Entrada */}
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Entrada
          </Label>
          <MultiSelect
            options={entryOptions}
            selected={filters.entryNumbers}
            onChange={(selected) => setFilters(prev => ({ ...prev, entryNumbers: selected }))}
            placeholder="Selecione..."
            searchPlaceholder="Buscar entrada..."
            emptyMessage="Nenhuma entrada encontrada."
            className={cn(isTvMode && "h-12 text-lg")}
          />
        </div>

        {/* Documento */}
        <div className="min-w-[140px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Documento
          </Label>
          <Select
            value={filters.documento}
            onValueChange={(value) => handleFilterChange("documento", value)}
          >
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {documentos.map((doc) => (
                <SelectItem key={doc} value={doc}>
                  {doc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Container Type */}
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Tipo de Entrada
          </Label>
          <Select
            value={filters.containerType}
            onValueChange={(value) => handleFilterChange("containerType", value)}
          >
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.values(ContainerType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Status
          </Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.values(ContainerStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company */}
        <div className="min-w-[200px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Empresa
          </Label>
          <Select
            value={filters.company}
            onValueChange={(value) => handleFilterChange("company", value)}
          >
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Data Entrada De
          </Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className={cn(isTvMode && "h-12 text-lg")}
          />
        </div>

        {/* Date To */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Data Entrada Ate
          </Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className={cn(isTvMode && "h-12 text-lg")}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size={isTvMode ? "lg" : "default"}
              onClick={onReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}

          <Button
            variant="outline"
            size={isTvMode ? "lg" : "default"}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>

          <Button
            variant={isTvMode ? "default" : "outline"}
            size={isTvMode ? "lg" : "default"}
            onClick={onToggleTvMode}
            className="gap-2"
          >
            {isTvMode ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Sair TV
              </>
            ) : (
              <>
                <Tv className="h-4 w-4" />
                Modo TV
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            Filtros ativos: {totalContainers} containers encontrados
          </span>
        </div>
      )}
    </div>
  );
}

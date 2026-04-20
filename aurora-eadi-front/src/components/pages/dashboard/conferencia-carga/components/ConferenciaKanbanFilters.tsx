"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Filter, Loader2, Minimize2, RefreshCw, Search, Tv, X } from "lucide-react";

export interface ConferenciaCargaFilters {
  search: string;
  conferenciaIds: string[];
  modalidade: string;
  cliente: string;
  despachante: string;
  dateFrom: string;
  dateTo: string;
}

interface ConferenciaKanbanFiltersProps {
  filters: ConferenciaCargaFilters;
  setFilters: React.Dispatch<React.SetStateAction<ConferenciaCargaFilters>>;
  conferenciaIds: string[];
  modalidades: string[];
  clientes: string[];
  despachantes: string[];
  onReset: () => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  onRefresh: () => void;
  total: number;
  isRefreshing?: boolean;
}

export function ConferenciaKanbanFilters({
  filters,
  setFilters,
  conferenciaIds,
  modalidades,
  clientes,
  despachantes,
  onReset,
  isTvMode,
  onToggleTvMode,
  onRefresh,
  total,
  isRefreshing = false,
}: ConferenciaKanbanFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.conferenciaIds.length > 0 ||
    filters.modalidade ||
    filters.cliente ||
    filters.despachante ||
    filters.dateFrom ||
    filters.dateTo;

  const conferenciaOptions = conferenciaIds.map((id) => ({ value: id, label: id }));

  const handleFilterChange = (key: keyof ConferenciaCargaFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm p-4", isTvMode && "p-6")}>
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="text-xs text-gray-500 mb-1.5 block">
            Buscar Cliente / Documento / Despachante
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Cliente, documento, lote..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className={cn("pl-9", isTvMode && "h-12 text-lg")}
            />
          </div>
        </div>

        {/* Conferencia */}
        <div className="min-w-[180px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">Conferência nº</Label>
          <MultiSelect
            options={conferenciaOptions}
            selected={filters.conferenciaIds}
            onChange={(selected) => setFilters((prev) => ({ ...prev, conferenciaIds: selected }))}
            placeholder="Selecione..."
            searchPlaceholder="Buscar..."
            emptyMessage="Nenhuma Conferência encontrada."
            className={cn(isTvMode && "h-12 text-lg")}
          />
        </div>

        {/* Modalidade */}
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">Modalidade</Label>
          <Select value={filters.modalidade} onValueChange={(value) => handleFilterChange("modalidade", value)}>
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {modalidades.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div className="min-w-[220px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">Cliente</Label>
          <Select value={filters.cliente} onValueChange={(value) => handleFilterChange("cliente", value)}>
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Despachante */}
        <div className="min-w-[220px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">Despachante</Label>
          <Select value={filters.despachante} onValueChange={(value) => handleFilterChange("despachante", value)}>
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {despachantes.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">Data De</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className={cn(isTvMode && "h-12 text-lg")}
          />
        </div>

        {/* Date To */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">Data Ate</Label>
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
            <Button variant="outline" size={isTvMode ? "lg" : "default"} onClick={onReset} className="gap-2">
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
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filtros ativos: {total} registros encontrados</span>
        </div>
      )}
    </div>
  );
}


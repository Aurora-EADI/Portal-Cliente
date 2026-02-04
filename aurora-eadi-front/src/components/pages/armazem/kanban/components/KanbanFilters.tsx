"use client";

import { KanbanFilters as KanbanFiltersType, ContainerType } from "@/types";
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
import {
  Search,
  Filter,
  X,
  Tv,
  Minimize2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanFiltersProps {
  filters: KanbanFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<KanbanFiltersType>>;
  clients: string[];
  onReset: () => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  onRefresh: () => void;
  totalContainers: number;
}

export function KanbanFilters({
  filters,
  setFilters,
  clients,
  onReset,
  isTvMode,
  onToggleTvMode,
  onRefresh,
  totalContainers
}: KanbanFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.containerType ||
    filters.client ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.priority;

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
            Buscar Container / BL / DI
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="MSKU1234567, BL, DI..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className={cn(
                "pl-9",
                isTvMode && "h-12 text-lg"
              )}
            />
          </div>
        </div>

        {/* Container Type */}
        <div className="min-w-[160px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Tipo Container
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

        {/* Client */}
        <div className="min-w-[200px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Cliente
          </Label>
          <Select
            value={filters.client}
            onValueChange={(value) => handleFilterChange("client", value)}
          >
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="min-w-[140px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Prioridade
          </Label>
          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger className={cn(isTvMode && "h-12 text-lg")}>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="min-w-[150px]">
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Data Chegada De
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
            Data Chegada Ate
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
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
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

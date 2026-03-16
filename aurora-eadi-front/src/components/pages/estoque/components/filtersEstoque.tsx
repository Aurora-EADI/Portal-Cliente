"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X, Calendar } from "lucide-react";
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";
import { ExportExcelEstoqueButton } from "./ExportExcelEstoqueButton";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

export interface EstoqueFiltersProps {
  cliente: string[];
  n_lote: string;
  dt_inicio: string;
  dt_fim: string;
}

interface ClienteOption {
  cliente: string;
}

interface Props {
  filters: EstoqueFiltersProps;
  setFilters: React.Dispatch<React.SetStateAction<EstoqueFiltersProps>>;
  onFetch: () => void;
  clientes?: ClienteOption[];
  filteredData: TypeEstoque[];
}

export function EstoqueFilters({
  filters,
  setFilters,
  onFetch,
  clientes = [],
  filteredData,
}: Props) {
  const [showFilters, setShowFilters] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  const clienteOptions: MultiSelectOption[] = useMemo(() => 
    clientes.map(c => ({ value: c.cliente, label: c.cliente })),
  [clientes]);


  function clearSearch() {
    setFilters((prev) => ({ ...prev, cliente: [] }));
  }

  function clearFilters() {
    setFilters({ cliente: [], n_lote: "", dt_inicio: "", dt_fim: "" });
  }

  function clearDateRange() {
    setFilters((prev) => ({ ...prev, dt_inicio: "", dt_fim: "" }));
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleDateInicioChange = (value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, dt_inicio: value };
      if (prev.dt_fim && value && value > prev.dt_fim) {
        newFilters.dt_fim = "";
      }
      return newFilters;
    });
  };

  const handleDateFimChange = (value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, dt_fim: value };
      if (prev.dt_inicio && value && value < prev.dt_inicio) {
        newFilters.dt_inicio = "";
      }
      return newFilters;
    });
  };

  const hasActiveFilters = () =>
    filters.cliente.length > 0 || filters.n_lote || filters.dt_inicio || filters.dt_fim;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros
            </CardTitle>
            {hasActiveFilters() && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                Filtros ativos
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toggle-filters-estoque" className="text-sm text-gray-600 cursor-pointer">
              {showFilters ? "Ocultar" : "Mostrar"}
            </Label>
            <Switch
              id="toggle-filters-estoque"
              checked={showFilters}
              onCheckedChange={setShowFilters}
            />
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="space-y-6">
            {/* Período */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Período de Entrada</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Label className="text-xs text-gray-600 mb-1.5 block">Data Início</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={filters.dt_inicio || ""}
                      onChange={(e) => handleDateInicioChange(e.target.value)}
                      max={filters.dt_fim || undefined}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Label className="text-xs text-gray-600 mb-1.5 block">Data Fim *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={filters.dt_fim || ""}
                      onChange={(e) => handleDateFimChange(e.target.value)}
                      min={filters.dt_inicio || undefined}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {(filters.dt_inicio || filters.dt_fim) && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200 mt-3">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-900 flex-1">
                    {filters.dt_inicio && formatDateDisplay(filters.dt_inicio)}
                    {filters.dt_inicio && filters.dt_fim && " até "}
                    {filters.dt_fim && formatDateDisplay(filters.dt_fim)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearDateRange}
                    className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-transparent flex-shrink-0"
                    title="Limpar período"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Cliente e Nº Lote - Ocultar se não houver dados */}
            {clientes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                {/* Cliente MultiSelect */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Clientes</Label>
                  <MultiSelect
                    options={clienteOptions}
                    selected={filters.cliente}
                    onChange={(selected) => setFilters(prev => ({ ...prev, cliente: selected }))}
                    placeholder="Selecione os clientes..."
                    searchPlaceholder="Buscar cliente..."
                  />
                </div>

                {/* Nº Lote */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Nº Lote</Label>
                  <Input
                    placeholder="Filtrar por Nº Lote"
                    value={filters.n_lote}
                    onChange={(e) => setFilters((prev) => ({ ...prev, n_lote: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters()}
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>

              <ExportExcelEstoqueButton
                data={filteredData}
                dt_inicio={filters.dt_inicio}
                dt_fim={filters.dt_fim}
              />
            </div>

            <Button
              disabled={!filters.dt_fim}
              onClick={onFetch}
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar Dados
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X, Calendar } from "lucide-react";
import { TypeEstoque } from "@/services/estoque/types/TypeEstoque";
import { ExportExcelEstoqueButton } from "./ExportExcelEstoqueButton";

export interface EstoqueFiltersProps {
  cliente: string;
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

export function EstoqueFilters({ filters, setFilters, onFetch, clientes = [], filteredData }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.cliente);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredClientes, setFilteredClientes] = useState<ClienteOption[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(filters.cliente);
  }, [filters.cliente]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = clientes.filter((c) =>
        c.cliente.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    } else {
      setFilteredClientes([]);
    }
  }, [searchTerm, clientes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCliente(cliente: ClienteOption) {
    setSearchTerm(cliente.cliente);
    setFilters((prev) => ({ ...prev, cliente: cliente.cliente }));
    setShowSuggestions(false);
  }

  function clearSearch() {
    setSearchTerm("");
    setFilters((prev) => ({ ...prev, cliente: "" }));
    setShowSuggestions(false);
  }

  function clearFilters() {
    setSearchTerm("");
    setFilters({ cliente: "", n_lote: "", dt_inicio: "", dt_fim: "" });
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
    filters.cliente || filters.n_lote || filters.dt_inicio || filters.dt_fim;

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
          <div className="space-y-4">
            {/* Período */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Período de Entrada</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Label className="text-xs text-gray-600 mb-1.5 block">Data Início *</Label>
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

            {/* Cliente e Nº Lote */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente com autocomplete */}
              <div className="relative" ref={searchRef}>
                <Label className="text-sm font-medium mb-2 block">Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar Cliente..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {showSuggestions && filteredClientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredClientes.map((cliente, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCliente(cliente)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm">{cliente.cliente}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showSuggestions && searchTerm && filteredClientes.length === 0 && clientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-3">
                    <p className="text-sm text-gray-500">Nenhum cliente encontrado</p>
                  </div>
                )}
              </div>

              {/* Nº Lote */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Nº Lote</Label>
                <Input
                  placeholder="Nº Lote"
                  value={filters.n_lote}
                  onChange={(e) => setFilters((prev) => ({ ...prev, n_lote: e.target.value }))}
                />
              </div>
            </div>
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
              disabled={!filters.dt_inicio || !filters.dt_fim}
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

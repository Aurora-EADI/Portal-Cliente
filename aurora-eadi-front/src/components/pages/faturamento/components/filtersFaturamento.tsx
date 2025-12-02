"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X, Calendar } from "lucide-react";

interface FiltersProps {
  cliente: string;
  cod_cli: string;
  n_fatura: string;
  n_di: string;
  n_lote: string;
  modalidade_txt: string;
  rps: string;
  dt_fatura_inicio?: string; // formato: YYYY-MM-DD
  dt_fatura_fim?: string;    // formato: YYYY-MM-DD
}

interface ClienteOption {
  cod_cli: string;
  cliente: string;
}

interface Props {
  filters: FiltersProps;
  setFilters: React.Dispatch<React.SetStateAction<FiltersProps>>;
  onFetch: () => void;
  clientes?: ClienteOption[];
}

export function FaturamentoFilters({ filters, setFilters, onFetch, clientes = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.cliente);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredClientes, setFilteredClientes] = useState<ClienteOption[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filtrar clientes baseado no termo de busca
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = clientes.filter((c) =>
        c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cod_cli.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    } else {
      setFilteredClientes([]);
    }
  }, [searchTerm, clientes]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCliente = (cliente: ClienteOption) => {
    setSearchTerm(cliente.cliente);
    setFilters((prev) => ({
      ...prev,
      cliente: cliente.cliente,
      cod_cli: cliente.cod_cli
    }));
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilters((prev) => ({ ...prev, cliente: "", cod_cli: "" }));
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      cliente: "",
      cod_cli: "",
      n_fatura: "",
      n_di: "",
      n_lote: "",
      modalidade_txt: "",
      rps: "",
      dt_fatura_inicio: "",
      dt_fatura_fim: ""
    });
  };

  const clearDateRange = () => {
    setFilters((prev) => ({
      ...prev,
      dt_fatura_inicio: "",
      dt_fatura_fim: ""
    }));
  };

  // Formatar data para exibição (DD/MM/YYYY)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>

          <div className="flex items-center gap-2">
            <Label htmlFor="toggle-filters" className="text-sm text-gray-600 cursor-pointer">
              {showFilters ? "Ocultar" : "Mostrar"}
            </Label>
            <Switch
              id="toggle-filters"
              checked={showFilters}
              onCheckedChange={setShowFilters}
            />
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Buscar Cliente */}
            <div className="relative" ref={searchRef}>
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
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                      <div className="text-xs text-gray-500">{cliente.cod_cli}</div>
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

            {/* Código Cliente */}
            <Input
              placeholder="Código Cliente"
              value={filters.cod_cli}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, cod_cli: e.target.value }))
              }
              readOnly={!!searchTerm}
              className={searchTerm ? "bg-gray-50" : ""}
            />

            {/* Nº RPS */}
            <Input
              placeholder="Nº RPS"
              value={filters.rps}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, rps: e.target.value }))
              }
            />

            {/* Nº Fatura */}
            <Input
              placeholder="Nº Fatura"
              value={filters.n_fatura}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, n_fatura: e.target.value }))
              }
            />

            {/* Nº DI */}
            <Input
              placeholder="Nº DI"
              value={filters.n_di}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, n_di: e.target.value }))
              }
            />

            {/* Nº Lote */}
            <Input
              placeholder="Nº Lote"
              value={filters.n_lote}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, n_lote: e.target.value }))
              }
            />

            {/* Modalidade Texto */}
            <Input
              placeholder="Modalidade (Marítimo, Aéreo)"
              value={filters.modalidade_txt}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, modalidade_txt: e.target.value }))
              }
            />

            {/* Data Início */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                placeholder="Data Início"
                value={filters.dt_fatura_inicio || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dt_fatura_inicio: e.target.value }))
                }
                className="pl-10"
              />
            </div>

            {/* Data Fim */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                placeholder="Data Fim"
                value={filters.dt_fatura_fim || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dt_fatura_fim: e.target.value }))
                }
                className="pl-10"
              />
            </div>

            {/* Exibir range selecionado */}
            {(filters.dt_fatura_inicio || filters.dt_fatura_fim) && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  {filters.dt_fatura_inicio && formatDateDisplay(filters.dt_fatura_inicio)}
                  {filters.dt_fatura_inicio && filters.dt_fatura_fim && " até "}
                  {filters.dt_fatura_fim && formatDateDisplay(filters.dt_fatura_fim)}
                </span>
                <button
                  onClick={clearDateRange}
                  className="ml-auto text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={clearFilters}>
              Limpar Filtros
            </Button>

            <Button onClick={onFetch}>
              Buscar Dados
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
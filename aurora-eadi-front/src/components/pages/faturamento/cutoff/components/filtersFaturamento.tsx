"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X, Calendar } from "lucide-react";
import { CustomButton } from "@/components/ui/CustomButton";
import { ExportExcelButton } from "./ExportExcelButton";
import { TypeBillingCutOff } from "@/services/faturamento/types/TypeBillingCutOff";
import { FiltersProps } from '../Dashboard';
import { SelectModalidadeMulti } from "@/components/ui/SelectModalidade";
import { PermissionRouteGuard } from "@/components/guards/PermissionRouteGuard";
import { usePermission } from "@/hooks/usePermission";
import { useModuleAccess } from "@/hooks/useModuleAccess";

interface ClienteOption {
  cliente: string;
}

interface Props {
  filters: FiltersProps;
  setFilters: React.Dispatch<React.SetStateAction<FiltersProps>>;
  onFetch: () => void;
  clientes?: ClienteOption[];
  filteredData?: TypeBillingCutOff[];
}

export function FaturamentoFilters({ filters, setFilters, onFetch, clientes = [], filteredData = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.cliente);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredClientes, setFilteredClientes] = useState<ClienteOption[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const [modalidades, setModalidades] = useState<string[]>([]);

  // DEBUG: Verificar permissões - REMOVER DEPOIS
  const { module, isLoading: moduleLoading, hasAccess } = useModuleAccess('/faturamento/cutoff');
  const { hasPermission, isLoading: permissionLoading } = usePermission('/faturamento/cutoff', 'FAT_EXPORT_CUTOFF');

  useEffect(() => {
    if (!moduleLoading && !permissionLoading) {
      console.log('🔍 DEBUG Permissões:');
      console.log('📁 Módulo encontrado:', module);
      console.log('✅ Tem acesso ao módulo:', hasAccess);
      console.log('🔐 Tem permissão FAT_EXPORT_CUTOFF:', hasPermission);
      console.log('📋 Atividades:', module?.activities);
      console.log('🎯 Atividades ativas:', module?.activities?.filter(a => a.isActive));
      console.log('🔑 Permissão procurada:', 'FAT_EXPORT_CUTOFF');
    }
  }, [module, moduleLoading, permissionLoading, hasAccess, hasPermission]);

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
    setFilters((prev) => ({
      ...prev,
      cliente: cliente.cliente,
    }));
    setShowSuggestions(false);
  };

  function clearSearch() {
    setSearchTerm("");
    setFilters((prev) => ({ ...prev, cliente: "" }));
    setShowSuggestions(false);
  };

  function clearFilters() {
    setSearchTerm("");
    setFilters({
      cliente: "",
      bl_awb: "",
      lote: "",
      container: "",
      dta: "",
      dt_entrada_inicio: "",
      dt_entrada_fim: "",
      n_fatura: "",
      n_di: "",
      n_lote: "",
      MODALIDADE: [],
      rps: "",
    });
  };

  function clearDateRange() {
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

  // Validar se data fim é maior que data início
  const handleDateInicioChange = (value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, dt_entrada_inicio: value };

      // Se já existe data fim e a nova data início é maior, limpa data fim
      if (prev.dt_entrada_fim && value && value > prev.dt_entrada_fim) {
        newFilters.dt_entrada_fim = "";
      }

      return newFilters;
    });
  };

  const handleDateFimChange = (value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, dt_entrada_fim: value };

      // Se já existe data início e a nova data fim é menor, limpa data início
      if (prev.dt_entrada_inicio && value && value < prev.dt_entrada_inicio) {
        newFilters.dt_entrada_inicio = "";
      }

      return newFilters;
    });
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = () => {
    return (
      filters.cliente ||
      filters.n_fatura ||
      filters.n_di ||
      filters.n_lote ||
      filters.MODALIDADE ||
      filters.rps ||
      filters.dt_entrada_inicio ||
      filters.dt_entrada_fim
    );
  };

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
          <div className="space-y-4">

            <div>
              <Label className="text-sm font-medium mb-3 block">Período de Faturamento</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="relative">
                  <Label className="text-xs text-gray-600 mb-1.5 block">Data Início *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={filters.dt_entrada_inicio || ""}
                      onChange={(e) => handleDateInicioChange(e.target.value)}
                      max={filters.dt_entrada_fim || undefined}
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
                      value={filters.dt_entrada_fim || ""}
                      onChange={(e) => handleDateFimChange(e.target.value)}
                      min={filters.dt_entrada_inicio || undefined}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {(filters.dt_entrada_inicio || filters.dt_entrada_fim) && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200 mt-3">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-900 flex-1">
                    {filters.dt_entrada_inicio && formatDateDisplay(filters.dt_entrada_inicio)}
                    {filters.dt_entrada_inicio && filters.dt_entrada_fim && " até "}
                    {filters.dt_entrada_fim && formatDateDisplay(filters.dt_entrada_fim)}
                  </span>
                  <button
                    onClick={clearDateRange}
                    className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="Limpar período"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">

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

              <div>
                <div>
                  <SelectModalidadeMulti
                    value={modalidades}
                    onChange={(values) => {
                      setModalidades(values);
                      setFilters((prev) => ({
                        ...prev,
                        MODALIDADE: values // ou salve como array, se preferir
                      }));
                    }}
                  />
                </div>
              </div>

            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Nº RPS</Label>
                <Input
                  placeholder="Nº RPS"
                  value={filters.rps}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, rps: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Nº Fatura</Label>
                <Input
                  placeholder="Nº Fatura"
                  value={filters.n_fatura}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, n_fatura: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Nº DI</Label>
                <Input
                  placeholder="Nº DI"
                  value={filters.n_di}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, n_di: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Nº Lote</Label>
                <Input
                  placeholder="Nº Lote"
                  value={filters.n_lote}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, n_lote: e.target.value }))
                  }
                />
              </div>
            </div> */}


          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <div className="flex justify-start gap-10">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters()}
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>

              <PermissionRouteGuard isBlockPage={false} moduleRoute="/faturamento" requiredPermissions={['FAT_EXPORT_CUTOFF']}>
                <ExportExcelButton data={filteredData} />
              </PermissionRouteGuard>
            </div>

            <CustomButton

              icon={<Search className="w-4 h-4" />}
              onClick={onFetch}
            >
              Buscar Dados
            </CustomButton>

          </div>
        </CardContent>
      )}
    </Card>
  );
}
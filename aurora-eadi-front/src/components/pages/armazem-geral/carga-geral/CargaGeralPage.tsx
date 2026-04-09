"use client";

import React, { useMemo, useState } from "react";
import { PageHeader, DataTable, Column, SearchBar, StatusCards, StatusCardConfig } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Plus, Box, FileText, AlertOctagon, Package, MapPin, ArrowLeftRight, Layers, PackageOpen, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCargoList, useRemoveCargo } from "@/hooks/armazem-geral/useCargo";
import { RegisterCargoModal } from "./RegisterCargoModal";
import { CargoDetailsCard } from "./CargoDetailsCard";
import { WarehouseCargo } from "@/types/armazem-geral";
import { toast } from "sonner";

function formatCargoType(type: string) {
  switch (type) {
    case "BOXES":
      return "Caixaria";
    case "PALLETIZED":
      return "Paletizada";
    case "LOOSE":
      return "Solta";
    default:
      return type;
  }
}

export function CargaGeralPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchBarKey, setSearchBarKey] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [activeSituation, setActiveSituation] = useState<"ALL" | "STORED" | "LOOSE" | "TRANSSHIPMENT">("ALL");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedCargoTypes, setSelectedCargoTypes] = useState<string[]>([]);
  const limit = 10;
  
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewingCargo, setViewingCargo] = useState<WarehouseCargo | null>(null);
  const [editingCargo, setEditingCargo] = useState<WarehouseCargo | null>(null);

  const { data, isLoading, isError } = useCargoList({
    page,
    limit,
    search: search || undefined,
  });

  const { mutateAsync: removeCargo } = useRemoveCargo();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const allItems = data?.data || [];

  const customerOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    let hasNone = false;
    for (const item of allItems) {
      const name = item.customer?.name || item.customer?.corporateName || null;
      if (name) set.add(name);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem cliente" }] : []),
      ...values.map((name) => ({ value: name, label: name })),
    ];
  }, [allItems]);

  const cargoTypeOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    let hasNone = false;
    for (const item of allItems) {
      if (item.cargoType) set.add(item.cargoType);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem tipo" }] : []),
      ...values.map((t) => ({ value: t, label: formatCargoType(t) })),
    ];
  }, [allItems]);

  const baseFiltered = useMemo(() => {
    return allItems.filter((item) => {
      const customerName = item.customer?.name || item.customer?.corporateName || null;
      const matchesCustomer =
        selectedCustomers.length === 0 ||
        (selectedCustomers.includes("__NONE__") && !customerName) ||
        (!!customerName && selectedCustomers.includes(customerName));

      const matchesType =
        selectedCargoTypes.length === 0 ||
        (selectedCargoTypes.includes("__NONE__") && !item.cargoType) ||
        (!!item.cargoType && selectedCargoTypes.includes(item.cargoType));

      return matchesCustomer && matchesType;
    });
  }, [allItems, selectedCustomers, selectedCargoTypes]);

  const getSituation = (item: WarehouseCargo): "STORED" | "LOOSE" | "TRANSSHIPMENT" => {
    if (item.container?.status === "TRANSSHIPMENT") return "TRANSSHIPMENT";
    if (item.container || item.ownedContainer) return "STORED";
    return "LOOSE";
  };

  const statusCounts = useMemo(() => {
    const stored = baseFiltered.filter((i) => getSituation(i) === "STORED").length;
    const loose = baseFiltered.filter((i) => getSituation(i) === "LOOSE").length;
    const trans = baseFiltered.filter((i) => getSituation(i) === "TRANSSHIPMENT").length;
    return {
      ALL: baseFiltered.length,
      STORED: stored,
      LOOSE: loose,
      TRANSSHIPMENT: trans,
    };
  }, [baseFiltered]);

  const filteredItems = useMemo(() => {
    if (activeSituation === "ALL") return baseFiltered;
    return baseFiltered.filter((i) => getSituation(i) === activeSituation);
  }, [activeSituation, baseFiltered]);

  const situationCards: StatusCardConfig[] = [
    {
      status: "ALL",
      label: "Total",
      icon: Layers,
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
    {
      status: "STORED",
      label: "Armazenado",
      icon: Package,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
    },
    {
      status: "LOOSE",
      label: "Carga solta",
      icon: PackageOpen,
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
    },
    {
      status: "TRANSSHIPMENT",
      label: "Em transbordo",
      icon: ArrowLeftRight,
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    },
  ];

  const hasActiveFilters =
    search.length > 0 ||
    selectedCustomers.length > 0 ||
    selectedCargoTypes.length > 0 ||
    activeSituation !== "ALL";

  const clearAllFilters = () => {
    setSelectedCustomers([]);
    setSelectedCargoTypes([]);
    setActiveSituation("ALL");
    setSearch("");
    setSearchBarKey((k) => k + 1);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro de carga?")) return;
    try {
      await removeCargo(id);
      toast.success("Carga excluída com sucesso.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao excluir carga.");
    }
  };

  const columns: Column<WarehouseCargo>[] = [
    {
      key: "description",
      header: "Descrição",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Box size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-900">{item.description}</div>
            <div className="text-xs text-gray-500 font-medium lowercase">
                tipo: {
                    item.cargoType === 'BOXES' ? 'CAIXARIA' : 
                    item.cargoType === 'PALLETIZED' ? 'PALETIZADA' : 
                    item.cargoType === 'LOOSE' ? 'SOLTA' : 
                    item.cargoType || "N/A"
                }
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "weightKg",
      header: "Peso (kg)",
      render: (item) => (
        <span className="text-gray-600 font-mono">{item.weightKg ? `${item.weightKg} kg` : "-"}</span>
      ),
    },
    {
      key: "quantity",
      header: "Qtd",
      render: (item) => (
        <span className="text-gray-600 font-semibold">{item.quantity}</span>
      ),
    },
    {
      key: "customer",
      header: "Cliente / Importador",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-xs">
            {item.customer?.name || item.customer?.corporateName || "---"}
          </span>
          <span className="text-[10px] text-gray-400 font-medium lowercase">
            {item.documents && item.documents.length > 0 ? (
                item.documents.map(d => `${d.type === 'DI' ? 'DI' : 'NR'} ${d.number}`).join(', ')
            ) : item.documentNumber && !item.documentNumber.includes('## Error Type') ? (
              `${item.documentType === 'DI' ? 'DI' : 'NR'} ${item.documentNumber}`
            ) : (
                "SEM DOCUMENTO"
            )}
          </span>
        </div>
      ),
    },
    {
      key: "container",
      header: "Contêiner",
      render: (item) => (
        (item.container || item.ownedContainer) ? (
          <div className={cn(
            "flex items-center gap-1.5 font-medium",
            item.container?.status === 'TRANSSHIPMENT' ? "text-orange-600" : "text-primary-600"
          )}>
            {item.container?.status === 'TRANSSHIPMENT' ? <ArrowLeftRight size={14} className="animate-pulse" /> : <Package size={14} />}
            {item.container?.containerNumber || item.ownedContainer?.containerNumber}
          </div>
        ) : (
          <span className="text-gray-400 italic text-xs">Carga Solta</span>
        )
      ),
    },
    {
      key: "location",
      header: "Localização",
      render: (item) => (
        item.location ? (
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[11px]">
            <MapPin size={12} />
            {item.location}
          </div>
        ) : (
          <span className="text-gray-400">---</span>
        )
      ),
    },
    {
      key: "dangerous",
      header: "Status",
      align: "center",
      render: (item) => (
        <div className="flex flex-col gap-1 items-center">
          {item.dangerous && (
            <div className="flex items-center justify-center text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 gap-1">
              <AlertOctagon size={10} />
              <span className="text-[9px] font-bold">IMO</span>
            </div>
          )}
          
          {item.container?.status === 'TRANSSHIPMENT' ? (
            <div className="flex items-center justify-center text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 gap-1 shadow-sm">
                <span className="text-[9px] font-bold uppercase tracking-wider">Em Transbordo</span>
            </div>
          ) : (item.container || item.ownedContainer) ? (
            <div className="flex flex-col gap-0.5 items-center">
                <div className="flex items-center justify-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Armazenado</span>
                </div>
                {item.ownedContainer && (
                    <span className="text-[8px] text-primary-500 font-bold uppercase tracking-tighter">Próprio/Aurora</span>
                )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">Carga Solta</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setViewingCargo(item)}
            className="p-2 hover:bg-gray-100 text-gray-500 hover:text-primary-600 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
            title="Ver Detalhes"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => {
              setEditingCargo(item);
              setIsRegisterModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
            title="Editar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Carga Geral"
        description="Gestão de cargas soltas e armazenagem geral."
        actions={
          <Button onClick={() => setIsRegisterModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Registrar Carga
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filtros
              </CardTitle>
              {hasActiveFilters && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Filtros ativos
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-filters-carga" className="text-sm text-gray-600 cursor-pointer">
                {showFilters ? "Ocultar" : "Mostrar"}
              </Label>
              <Switch id="toggle-filters-carga" checked={showFilters} onCheckedChange={setShowFilters} />
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Buscar</Label>
                <SearchBar
                  key={searchBarKey}
                  placeholder="Buscar por descrição ou tipo..."
                  onSearch={handleSearch}
                  onClear={handleClear}
                  showClearButton={!!search}
                  initialValue={search}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Clientes</Label>
                  <MultiSelect
                    options={customerOptions}
                    selected={selectedCustomers}
                    onChange={(selected) => {
                      setSelectedCustomers(selected);
                      setPage(1);
                    }}
                    placeholder="Selecione os clientes..."
                    searchPlaceholder="Buscar cliente..."
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipo de carga</Label>
                  <MultiSelect
                    options={cargoTypeOptions}
                    selected={selectedCargoTypes}
                    onChange={(selected) => {
                      setSelectedCargoTypes(selected);
                      setPage(1);
                    }}
                    placeholder="Selecione os tipos..."
                    searchPlaceholder="Buscar tipo..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
              <div />
            </div>
          </CardContent>
        )}
      </Card>

      <StatusCards
        cards={situationCards}
        statusCounts={statusCounts}
        activeStatus={activeSituation}
        onStatusClick={(status) => {
          setActiveSituation(status as any);
          setPage(1);
        }}
        columns={4}
      />

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar registros de carga."
        emptyMessage="Nenhuma carga registrada."
        pagination={
          data?.pagination
            ? {
                page,
                total: data.pagination.total,
                limit,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />

      {/* Modais */}
      <RegisterCargoModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setEditingCargo(null);
        }}
        editingCargo={editingCargo}
      />

      {viewingCargo && (
        <CargoDetailsCard
          cargo={viewingCargo}
          onClose={() => setViewingCargo(null)}
          onDelete={() => {
            handleDelete(viewingCargo.id);
            setViewingCargo(null);
          }}
        />
      )}
    </div>
  );
}

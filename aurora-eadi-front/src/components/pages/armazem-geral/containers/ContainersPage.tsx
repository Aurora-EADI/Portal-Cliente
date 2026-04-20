"use client";

import React, { useMemo, useState } from "react";
import { PageHeader, DataTable, Column, SearchBar, StatusCards, StatusCardConfig } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Plus, Package, FileText, ArrowRightLeft, Pencil, Layers, PackageCheck, PackageX, Search, X } from "lucide-react";
import { useContainersList } from "@/hooks/armazem-geral/useContainers";
import { RegisterOperationalContainerModal } from "./RegisterOperationalContainerModal";
import { EditOperationalContainerModal } from "./EditOperationalContainerModal";
import { ContainerDetailsCard } from "./ContainerDetailsCard";
import { ExitOperationalContainerModal } from "./ExitOperationalContainerModal";
import { OperationalContainer } from "@/types/armazem-geral";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ContainersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchBarKey, setSearchBarKey] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [activeFullStatus, setActiveFullStatus] = useState<"ALL" | "FULL" | "EMPTY">("ALL");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const limit = 10;
  
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [viewingContainer, setViewingContainer] = useState<OperationalContainer | null>(null);
  const [editingContainer, setEditingContainer] = useState<OperationalContainer | null>(null);

  const { data, isLoading, isError } = useContainersList({
    page,
    limit,
    search: search || undefined,
  });

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
      const name = item.customer?.name || null;
      if (name) set.add(name);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem cliente" }] : []),
      ...values.map((name) => ({ value: name, label: name })),
    ];
  }, [allItems]);

  const typeOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    let hasNone = false;
    for (const item of allItems) {
      if (item.containerType) set.add(item.containerType);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem tipo" }] : []),
      ...values.map((t) => ({ value: t, label: t })),
    ];
  }, [allItems]);

  const baseFiltered = useMemo(() => {
    return allItems.filter((item) => {
      const customerName = item.customer?.name || null;
      const matchesCustomer =
        selectedCustomers.length === 0 ||
        (selectedCustomers.includes("__NONE__") && !customerName) ||
        (!!customerName && selectedCustomers.includes(customerName));

      const matchesType =
        selectedTypes.length === 0 ||
        (selectedTypes.includes("__NONE__") && !item.containerType) ||
        (!!item.containerType && selectedTypes.includes(item.containerType));

      return matchesCustomer && matchesType;
    });
  }, [allItems, selectedCustomers, selectedTypes]);

  const statusCounts = useMemo(() => {
    const full = baseFiltered.filter((i) => i.isFull).length;
    const empty = baseFiltered.length - full;
    return {
      ALL: baseFiltered.length,
      FULL: full,
      EMPTY: empty,
    };
  }, [baseFiltered]);

  const filteredItems = useMemo(() => {
    if (activeFullStatus === "ALL") return baseFiltered;
    if (activeFullStatus === "FULL") return baseFiltered.filter((i) => i.isFull);
    return baseFiltered.filter((i) => !i.isFull);
  }, [activeFullStatus, baseFiltered]);

  const fullCards: StatusCardConfig[] = [
    {
      status: "ALL",
      label: "Total",
      icon: Layers,
      bgColor: "bg-slate-100",
      textColor: "text-slate-700",
    },
    {
      status: "FULL",
      label: "Cheio",
      icon: PackageCheck,
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
    },
    {
      status: "EMPTY",
      label: "Vazio",
      icon: PackageX,
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
    },
  ];

  const hasActiveFilters =
    search.length > 0 ||
    selectedCustomers.length > 0 ||
    selectedTypes.length > 0 ||
    activeFullStatus !== "ALL";

  const clearAllFilters = () => {
    setSelectedCustomers([]);
    setSelectedTypes([]);
    setActiveFullStatus("ALL");
    setSearch("");
    setSearchBarKey((k) => k + 1);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_WAREHOUSE':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold rounded-full border">Em Pátio</span>;
      case 'OUT':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border-gray-200 text-xs font-semibold rounded-full border">Saída</span>;
      case 'TRANSSHIPMENT':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold rounded-full border">Transbordo</span>;
      default:
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold rounded-full border">{status}</span>;
    }
  };

  const columns: Column<OperationalContainer>[] = [
    {
      key: "entryNumber",
      header: "Nº Entrada",
      render: (container) => (
        <span className="font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
          {container.entryNumber || "-"}
        </span>
      ),
    },
    {
      key: "containerNumber",
      header: "Nº Container",
      render: (container) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <Package size={16} />
          </div>
          <div className="font-bold text-gray-900">{container.containerNumber}</div>
        </div>
      ),
    },
    {
      key: "customerId",
      header: "Cliente",
      render: (container) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {container.customer?.name || "N/A"}
          </span>
          {container.customer?.document && (
            <span className="text-[10px] text-gray-400 font-mono">
              {container.customer.document}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "containerType",
      header: "Tipo",
      render: (container) => (
        <span className="text-gray-600 font-medium">{container.containerType || "-"}</span>
      ),
    },
    {
      key: "entryDate",
      header: "Data Entrada",
      render: (container) => (
        <span className="text-gray-500 text-sm">
          {container.entryDate ? new Date(container.entryDate).toLocaleDateString('pt-BR') : "-"}
        </span>
      ),
    },
    {
      key: "freeTimeDate",
      header: "Free Time",
      render: (container) => {
        if (!container.freeTimeDate || container.status === 'OUT') return <span className="text-gray-400">-</span>;
        
        const freeTimeDate = new Date(container.freeTimeDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        freeTimeDate.setHours(0, 0, 0, 0);
        
        const diffTime = freeTimeDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
        let label = `${diffDays} dias`;
        
        if (diffDays < 0) {
          badgeColor = "bg-red-50 text-red-700 border-red-100";
          label = `Excedido (${Math.abs(diffDays)}d)`;
        } else if (diffDays <= 7) {
          badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
          label = `Vencendo (${diffDays}d)`;
        }
        
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600 font-medium">{freeTimeDate.toLocaleDateString('pt-BR')}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border w-fit ${badgeColor}`}>
              {label}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (container) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(container.status)}
          {container.exitNumber && (
            <span className="text-[10px] text-gray-400 font-mono">SAÍDA: {container.exitNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Última Movimentação",
      render: (container) => (
        <span className="text-gray-500 text-sm">
          {formatDate(container.updatedAt)}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "center",
      render: (container) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setViewingContainer(container)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
          >
            <FileText size={16} />
            Detalhes
          </button>
          <button
            onClick={() => setEditingContainer(container)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-amber-500 hover:text-amber-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
          >
            <Pencil size={16} />
            Editar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Gestão de Containers"
        description="Controle de entrada, saída e movimentação de containers no Armazém Geral."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsExitModalOpen(true)}>
              <ArrowRightLeft className="w-4 h-4" /> Registrar Saída
            </Button>
            <Button onClick={() => setIsEntryModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Nova Entrada
            </Button>
          </div>
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
              <Label htmlFor="toggle-filters-containers" className="text-sm text-gray-600 cursor-pointer">
                {showFilters ? "Ocultar" : "Mostrar"}
              </Label>
              <Switch
                id="toggle-filters-containers"
                checked={showFilters}
                onCheckedChange={setShowFilters}
              />
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
                  placeholder="Buscar container por número..."
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
                  <Label className="text-sm font-medium mb-2 block">Tipo</Label>
                  <MultiSelect
                    options={typeOptions}
                    selected={selectedTypes}
                    onChange={(selected) => {
                      setSelectedTypes(selected);
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
        cards={fullCards}
        statusCounts={statusCounts}
        activeStatus={activeFullStatus}
        onStatusClick={(status) => {
          setActiveFullStatus(status as any);
          setPage(1);
        }}
        columns={3}
      />

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar containers."
        emptyMessage="Nenhum container registrado."
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
      <RegisterOperationalContainerModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
      />

      <ExitOperationalContainerModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        containers={filteredItems}
      />

      {viewingContainer && (
        <ContainerDetailsCard
          container={viewingContainer}
          onClose={() => setViewingContainer(null)}
        />
      )}

      {editingContainer && (
        <EditOperationalContainerModal
          isOpen={!!editingContainer}
          onClose={() => setEditingContainer(null)}
          container={editingContainer}
        />
      )}
    </div>
  );
}

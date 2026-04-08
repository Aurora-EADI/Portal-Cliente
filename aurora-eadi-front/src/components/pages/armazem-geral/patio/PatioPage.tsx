"use client";

import React, { useMemo, useState } from "react";
import { PageHeader, DataTable, Column, SearchBar, StatusCards, StatusCardConfig } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Layers, Map, Package, PackageCheck, PackageX, Search, X } from "lucide-react";
import { usePatioContainers, PatioContainer } from "@/hooks/armazem-geral/usePatioContainers";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function PatioPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchBarKey, setSearchBarKey] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [activeStatus, setActiveStatus] = useState<"ALL" | "FULL" | "EMPTY">("ALL");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const limit = 10;

  const { data, isLoading, isError } = usePatioContainers({
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
      if (item.ownerOrSupplier) set.add(item.ownerOrSupplier);
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
      const matchesCustomer =
        selectedCustomers.length === 0 ||
        (selectedCustomers.includes("__NONE__") && !item.ownerOrSupplier) ||
        (!!item.ownerOrSupplier && selectedCustomers.includes(item.ownerOrSupplier));

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
    if (activeStatus === "ALL") return baseFiltered;
    if (activeStatus === "FULL") return baseFiltered.filter((i) => i.isFull);
    return baseFiltered.filter((i) => !i.isFull);
  }, [activeStatus, baseFiltered]);

  const getStatusBadge = (isFull: boolean) => {
    if (isFull) {
      return (
        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold rounded-full border">
          CHEIO
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border-gray-200 text-xs font-semibold rounded-full border">
        VAZIO
      </span>
    );
  };

  const columns: Column<PatioContainer>[] = [
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
      key: "assetType",
      header: "Tipo de Ativo",
      render: (container) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded border ${
            container.assetType === "ORIGEM"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-indigo-50 text-indigo-700 border-indigo-200"
          }`}
        >
          {container.assetType}
        </span>
      ),
    },
    {
      key: "ownerOrSupplier",
      header: "Cliente",
      render: (container) => (
        <span className="font-medium text-gray-900">
          {!container.ownerOrSupplier || container.ownerOrSupplier === "N/A" ? "-" : container.ownerOrSupplier}
        </span>
      ),
    },
    {
      key: "containerType",
      header: "Tipo",
      render: (container) => <span className="text-gray-600 font-medium">{container.containerType || "-"}</span>,
    },
    {
      key: "location",
      header: "Localização",
      render: (container) => (
        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
          <Map className="w-4 h-4 text-gray-400" />
          {container.location || "Não definida"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (container) => <div className="flex flex-col gap-1">{getStatusBadge(container.isFull)}</div>,
    },
    {
      key: "entryDate",
      header: "Data de Entrada",
      render: (container) => <span className="text-gray-500 text-sm">{formatDate(container.entryDate)}</span>,
    },
  ];

  const cards: StatusCardConfig[] = [
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
    activeStatus !== "ALL";

  const clearAllFilters = () => {
    setSelectedCustomers([]);
    setSelectedTypes([]);
    setActiveStatus("ALL");
    setSearch("");
    setSearchBarKey((k) => k + 1);
    setPage(1);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Pátio"
        description="Visão geral de todos os containers (origem e próprios) atualmente no pátio do Armazém Geral."
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
              <Label htmlFor="toggle-filters-patio" className="text-sm text-gray-600 cursor-pointer">
                {showFilters ? "Ocultar" : "Mostrar"}
              </Label>
              <Switch id="toggle-filters-patio" checked={showFilters} onCheckedChange={setShowFilters} />
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
                  placeholder="Buscar container no pátio..."
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
        cards={cards}
        statusCounts={statusCounts}
        activeStatus={activeStatus}
        onStatusClick={(status) => {
          setActiveStatus(status as any);
          setPage(1);
        }}
        columns={3}
      />

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => `${item.assetType}-${item.id}`}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar dados do pátio. Verifique a API e tente novamente."
        emptyMessage="Nenhum container encontrado no pátio."
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
    </div>
  );
}

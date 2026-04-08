"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, DataTable, Column, SearchBar, StatusCards, StatusCardConfig } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Plus, Construction, CheckCircle, Clock, AlertTriangle, FileText, Package, MapPin, Layers, PackageCheck, PackageX, Search, X, LogIn, LogOut, Truck } from "lucide-react";
import { useOwnedContainersList, useRemoveOwnedContainer } from "@/hooks/armazem-geral/useOwnedContainers";
import { cargoService } from "@/services/armazem-geral/cargo.service";
import { RegisterOwnedContainerModal } from "./RegisterOwnedContainerModal";
import { OwnedContainerDetailsCard } from "./OwnedContainerDetailsCard";
import { DispatchOwnedContainerModal } from "./DispatchOwnedContainerModal";
import { ReturnOwnedContainerModal } from "./ReturnOwnedContainerModal";
import { WarehouseCargo, WarehouseOwnedContainer } from "@/types/armazem-geral";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: StatusCardConfig[] = [
  {
    status: 'ALL',
    label: 'Total',
    icon: Layers,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  {
    status: 'AVAILABLE',
    label: 'Disponível',
    icon: CheckCircle,
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  {
    status: 'IN_USE',
    label: 'Em Uso',
    icon: Clock,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    status: 'MAINTENANCE',
    label: 'Manutenção',
    icon: Construction,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    status: 'DAMAGED',
    label: 'Danificado',
    icon: AlertTriangle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
  },
  {
    status: 'WITH_CUSTOMER',
    label: 'Com Cliente',
    icon: Truck,
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
  },
];

type OwnedContainerRow = WarehouseOwnedContainer & {
  customerName: string | null;
};

export function ContainersAGPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchBarKey, setSearchBarKey] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [activeFullStatus, setActiveFullStatus] = useState<"ALL" | "FULL" | "EMPTY">("ALL");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const limit = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingContainer, setViewingContainer] = useState<WarehouseOwnedContainer | null>(null);
  const [editingContainer, setEditingContainer] = useState<WarehouseOwnedContainer | null>(null);
  const [dispatchingContainer, setDispatchingContainer] = useState<WarehouseOwnedContainer | null>(null);
  const [returningContainer, setReturningContainer] = useState<WarehouseOwnedContainer | null>(null);
  const [activePresence, setActivePresence] = useState<"ALL" | "PATIO" | "WITH_CUSTOMER">("ALL");

  const { data, isLoading, isError, error } = useOwnedContainersList({
    page,
    limit,
    search: search || undefined,
  });

  const { mutateAsync: removeContainer } = useRemoveOwnedContainer();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  const allItems = data?.data || [];

  const ownedContainerIds = useMemo(() => allItems.map((c) => c.id), [allItems]);

  const { data: activeCargosRes } = useQuery({
    queryKey: ["armazem-geral", "containers-ag", "active-cargos", ownedContainerIds],
    queryFn: () =>
      cargoService.findAll({
        page: 1,
        limit: 200,
        ownedContainerIds: ownedContainerIds.join(","),
        activeOnly: true,
      }),
    enabled: ownedContainerIds.length > 0,
    staleTime: 30 * 1000,
  });

  const activeCargos = (activeCargosRes?.data || []) as WarehouseCargo[];

  const cargoByOwnedContainerId = useMemo(() => {
    const map = new Map<string, WarehouseCargo>();
    for (const cargo of activeCargos) {
      if (cargo.ownedContainerId) map.set(cargo.ownedContainerId, cargo);
    }
    return map;
  }, [activeCargos]);

  const rows: OwnedContainerRow[] = useMemo(() => {
    return allItems.map((c) => {
      const cargo = cargoByOwnedContainerId.get(c.id);
      const derivedIsFull = !!cargo;
      const cargoCustomerName = derivedIsFull
        ? cargo?.customer?.name || cargo?.customer?.corporateName || null
        : null;

      const holderCustomerName = (c as any).holderCustomer?.name || null;
      const customerName = c.status === "WITH_CUSTOMER" ? holderCustomerName : cargoCustomerName;

      return {
        ...c,
        isFull: derivedIsFull,
        customerName,
      };
    });
  }, [allItems, cargoByOwnedContainerId]);

  const customerOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    let hasNone = false;
    for (const item of rows) {
      if (item.customerName) set.add(item.customerName);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem cliente" }] : []),
      ...values.map((name) => ({ value: name, label: name })),
    ];
  }, [rows]);

  const typeOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    let hasNone = false;
    for (const item of rows) {
      if (item.containerType) set.add(item.containerType);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem tipo" }] : []),
      ...values.map((t) => ({ value: t, label: t })),
    ];
  }, [rows]);

  const baseFiltered = useMemo(() => {
    const byPresence = rows.filter((item) => {
      if (activePresence === "ALL") return true;
      if (activePresence === "WITH_CUSTOMER") return item.status === "WITH_CUSTOMER";
      return item.status !== "WITH_CUSTOMER";
    });

    return byPresence.filter((item) => {
      const matchesCustomer =
        selectedCustomers.length === 0 ||
        (selectedCustomers.includes("__NONE__") && !item.customerName) ||
        (!!item.customerName && selectedCustomers.includes(item.customerName));

      const matchesType =
        selectedTypes.length === 0 ||
        (selectedTypes.includes("__NONE__") && !item.containerType) ||
        (!!item.containerType && selectedTypes.includes(item.containerType));

      return matchesCustomer && matchesType;
    });
  }, [rows, selectedCustomers, selectedTypes, activePresence]);

  const presenceCounts = useMemo(() => {
    const patio = rows.filter((r) => r.status !== "WITH_CUSTOMER").length;
    const withCustomer = rows.filter((r) => r.status === "WITH_CUSTOMER").length;
    return {
      ALL: rows.length,
      PATIO: patio,
      WITH_CUSTOMER: withCustomer,
    };
  }, [rows]);

  const fullCounts = useMemo(() => {
    const full = baseFiltered.filter((i) => i.isFull).length;
    const empty = baseFiltered.length - full;
    return { ALL: baseFiltered.length, FULL: full, EMPTY: empty };
  }, [baseFiltered]);

  const filteredItems = useMemo(() => {
    let items = baseFiltered;

    if (activeFullStatus === "FULL") items = items.filter((i) => i.isFull);
    if (activeFullStatus === "EMPTY") items = items.filter((i) => !i.isFull);

    return items;
  }, [activeFullStatus, baseFiltered]);

  const fullCards: StatusCardConfig[] = [
    {
      status: "ALL",
      label: "Todos",
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

  const resolvedErrorMessage = useMemo(() => {
    const err: any = error as any;
    const backendMessage = err?.response?.data?.message;

    if (typeof backendMessage === "string") return backendMessage;
    if (Array.isArray(backendMessage)) return backendMessage.join(", ");
    if (backendMessage && typeof backendMessage === "object") return JSON.stringify(backendMessage);
    if (typeof err?.message === "string") return err.message;

    return "Erro ao carregar frota de containers.";
  }, [error]);

  const hasActiveFilters =
    search.length > 0 ||
    selectedCustomers.length > 0 ||
    selectedTypes.length > 0 ||
    activeFullStatus !== "ALL" ||
    activePresence !== "ALL";

  const clearAllFilters = () => {
    setSelectedCustomers([]);
    setSelectedTypes([]);
    setActiveFullStatus("ALL");
    setActivePresence("ALL");
    setSearch("");
    setSearchBarKey((k) => k + 1);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este container da frota?")) return;
    try {
      await removeContainer(id);
      toast.success("Container removido com sucesso.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao remover container.");
    }
  };

  const columns: Column<OwnedContainerRow>[] = [
    {
      key: "code",
      header: "Identificação",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
              item.isFull ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100"
          )}>
            <Package size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900 leading-none">{item.containerNumber || "SEM NÚMERO"}</div>
            <div className="text-[10px] text-gray-400 font-mono uppercase mt-1">ID: {item.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: "containerType",
      header: "Tipo/Tam",
      render: (item) => <span className="text-gray-600 font-medium">{item.containerType || "-"}</span>,
    },
    {
      key: "customerName",
      header: "Cliente",
      render: (item) => (
        <span className="font-medium text-gray-900">{item.customerName || "-"}</span>
      ),
    },
    {
      key: "location",
      header: "Localização",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-xs font-bold">
              {item.status === "WITH_CUSTOMER" ? "COM CLIENTE" : (item.location || "PÁTIO")}
            </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const config = STATUS_CONFIG.find(c => c.status === item.status);
        return (
          <div className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
              config?.bgColor, config?.textColor, "border-current"
          )}>
            {config?.label}
          </div>
        );
      },
    },
    {
      key: "acoes",
      header: "Ações",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          {item.status === "WITH_CUSTOMER" ? (
            <button
              onClick={() => setReturningContainer(item)}
              className="p-2 hover:bg-gray-100 text-gray-500 hover:text-emerald-700 rounded-lg transition-colors border border-gray-100 shadow-sm"
              title="Registrar Devolução"
            >
              <LogIn size={16} />
            </button>
          ) : (
            <button
              onClick={() => setDispatchingContainer(item)}
              className="p-2 hover:bg-gray-100 text-gray-500 hover:text-indigo-700 rounded-lg transition-colors border border-gray-100 shadow-sm"
              title="Registrar Saída (Com Cliente)"
            >
              <LogOut size={16} />
            </button>
          )}
          <button
            onClick={() => setViewingContainer(item)}
            className="p-2 hover:bg-gray-100 text-gray-500 hover:text-primary-600 rounded-lg transition-colors border border-gray-100 shadow-sm"
            title="Ver Detalhes"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => {
              setEditingContainer(item);
              setIsModalOpen(true);
            }}
            className="p-2 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded-lg transition-colors border border-gray-100 shadow-sm"
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
        title="Frota de Containers AG"
        description="Gestão de containers de propriedade do Recinto."
        actions={
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Novo Container
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
              <Label htmlFor="toggle-filters-containers-ag" className="text-sm text-gray-600 cursor-pointer">
                {showFilters ? "Ocultar" : "Mostrar"}
              </Label>
              <Switch
                id="toggle-filters-containers-ag"
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
                  placeholder="Buscar por código ou número..."
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
        cards={[
          {
            status: "PATIO",
            label: "No Pátio",
            icon: Package,
            bgColor: "bg-emerald-100",
            textColor: "text-emerald-700",
          },
          {
            status: "WITH_CUSTOMER",
            label: "Com Cliente",
            icon: Truck,
            bgColor: "bg-indigo-100",
            textColor: "text-indigo-700",
          },
        ]}
        statusCounts={presenceCounts as any}
        activeStatus={activePresence}
        onStatusClick={(status) => {
          setActivePresence((prev) => (prev === status ? "ALL" : (status as any)));
          setPage(1);
        }}
        columns={2}
      />

      <StatusCards
        cards={fullCards}
        statusCounts={fullCounts}
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
        errorMessage={resolvedErrorMessage}
        emptyMessage="Nenhum container próprio cadastrado."
        pagination={
          data?.pagination
            ? {
                page,
                total: data.pagination.total,
                limit,
                onPageChange: (p) => setPage(p),
              }
            : undefined
        }
      />

      <RegisterOwnedContainerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContainer(null);
        }}
        editingContainer={editingContainer}
      />

      {viewingContainer && (
        <OwnedContainerDetailsCard
          container={viewingContainer}
          onClose={() => setViewingContainer(null)}
          onDelete={() => {
            handleDelete(viewingContainer.id);
            setViewingContainer(null);
          }}
        />
      )}

      <DispatchOwnedContainerModal
        isOpen={!!dispatchingContainer}
        onClose={() => setDispatchingContainer(null)}
        container={dispatchingContainer}
      />

      <ReturnOwnedContainerModal
        isOpen={!!returningContainer}
        onClose={() => setReturningContainer(null)}
        container={returningContainer}
      />
    </div>
  );
}

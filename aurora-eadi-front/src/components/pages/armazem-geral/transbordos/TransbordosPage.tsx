"use client";

import React, { useMemo, useState } from "react";
import { PageHeader, DataTable, Column, SearchBar, StatusCards, StatusCardConfig } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Plus, CheckCircle, AlertTriangle, FileText, Package, Hash, UserCircle, Pencil, Layers, Search, X } from "lucide-react";
import { useTransshipmentsList } from "@/hooks/armazem-geral/useTransshipments";
import { RegisterTransshipmentModal } from "./RegisterTransshipmentModal";
import { CompleteTransshipmentModal } from "./CompleteTransshipmentModal";
import { EditTransshipmentModal } from "./EditTransshipmentModal";
import { TransshipmentDetailsCard } from "./TransshipmentDetailsCard";
import { WarehouseTransshipment, TransshipmentStatus, TransshipmentReason } from "@/types/armazem-geral";

const REASON_LABELS: Record<TransshipmentReason, { label: string; color: string }> = {
  CONTAINER_DAMAGE: { label: 'Avaria no Container', color: 'bg-red-100 text-red-700' },
  CARGO_REGROUPING: { label: 'Reagrupamento', color: 'bg-blue-100 text-blue-700' },
  CLIENT_REQUEST: { label: 'Solicitação do Cliente', color: 'bg-orange-100 text-orange-700' },
  OTHER: { label: 'Outro', color: 'bg-gray-100 text-gray-600' },
};

const STATUS_CONFIG: StatusCardConfig[] = [
  {
    status: 'ALL',
    label: 'Total',
    icon: Layers,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  {
    status: 'PENDING',
    label: 'Pendente',
    icon: AlertTriangle,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    status: 'COMPLETED',
    label: 'Concluídos',
    icon: CheckCircle,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
  },
];

export function TransbordosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchBarKey, setSearchBarKey] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [activeStatus, setActiveStatus] = useState<"ALL" | TransshipmentStatus>("PENDING");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const limit = 10;
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [completingTransshipment, setCompletingTransshipment] = useState<WarehouseTransshipment | null>(null);
  const [editingTransshipment, setEditingTransshipment] = useState<WarehouseTransshipment | null>(null);
  const [viewingTransshipment, setViewingTransshipment] = useState<WarehouseTransshipment | null>(null);

  const { data, isLoading, isError } = useTransshipmentsList({
    page,
    limit,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  const allItems = data?.data || [];

  const reasonOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>();
    let hasNone = false;
    for (const item of allItems) {
      if (item.reason) set.add(item.reason);
      else hasNone = true;
    }
    const values = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return [
      ...(hasNone ? [{ value: "__NONE__", label: "Sem motivo" }] : []),
      ...values.map((r) => ({ value: r, label: REASON_LABELS[r as TransshipmentReason]?.label ?? r })),
    ];
  }, [allItems]);

  const baseFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesReason =
        selectedReasons.length === 0 ||
        (selectedReasons.includes("__NONE__") && !item.reason) ||
        (!!item.reason && selectedReasons.includes(item.reason));

      if (!matchesReason) return false;

      if (!query) return true;

      const haystack = [
        item.container?.containerNumber,
        item.cargo?.description,
        item.responsibleName,
        item.originalSeal,
        item.newSeal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [allItems, search, selectedReasons]);

  const statusCounts = useMemo(() => {
    const pending = baseFiltered.filter((i) => i.status === "PENDING").length;
    const completed = baseFiltered.filter((i) => i.status === "COMPLETED").length;
    return {
      ALL: baseFiltered.length,
      PENDING: pending,
      COMPLETED: completed,
    };
  }, [baseFiltered]);

  const filteredItems = useMemo(() => {
    if (activeStatus === "ALL") return baseFiltered;
    return baseFiltered.filter((i) => i.status === activeStatus);
  }, [activeStatus, baseFiltered]);

  const hasActiveFilters =
    search.length > 0 ||
    selectedReasons.length > 0 ||
    activeStatus !== "ALL";

  const clearAllFilters = () => {
    setSelectedReasons([]);
    setActiveStatus("ALL");
    setSearch("");
    setSearchBarKey((k) => k + 1);
    setPage(1);
  };

  const columns: Column<WarehouseTransshipment>[] = [
    {
      key: "container",
      header: "Contêiner",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <Package size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-900">{item.container?.containerNumber || "N/A"}</div>
            <div className="text-[10px] text-gray-400 font-mono italic">ID: {item.id.split('-')[0]}</div>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Motivo",
      render: (item) => {
        if (!item.reason) return <span className="text-gray-400 italic text-xs">—</span>;
        const cfg = REASON_LABELS[item.reason];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "seals",
      header: "Lacres",
      render: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Hash size={11} className="text-gray-400" />
            <span>Orig: <span className="font-medium text-gray-700">{item.originalSeal || '—'}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Hash size={11} className="text-orange-400" />
            <span className={item.newSeal ? 'font-bold text-orange-700' : 'italic text-gray-400'}>
              {item.newSeal ? `Aurora: ${item.newSeal}` : 'Novo lacre pendente'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "responsible",
      header: "Responsável",
      render: (item) => item.responsibleName ? (
        <div className="flex items-center gap-2 text-gray-700">
          <UserCircle size={15} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold leading-tight">{item.responsibleName}</p>
            {item.responsibleMatricula && <p className="text-[10px] text-gray-400">Mat. {item.responsibleMatricula}</p>}
          </div>
        </div>
      ) : <span className="text-gray-400 italic text-xs">Não informado</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const config = STATUS_CONFIG.find(c => c.status === item.status);
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config?.bgColor} ${config?.textColor} border-current opacity-90`}>
            {config?.label}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Início",
      render: (item) => (
        <span className="text-gray-500 text-xs">
          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setViewingTransshipment(item)}
            className="p-2 hover:bg-gray-100 text-gray-500 hover:text-orange-600 rounded-lg transition-colors border border-gray-100"
            title="Ver Detalhes"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => setEditingTransshipment(item)}
            className="p-2 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-lg transition-colors border border-gray-100"
            title="Editar Transbordo"
          >
            <Pencil size={16} />
          </button>
          {item.status === 'PENDING' && (
            <button
              onClick={() => setCompletingTransshipment(item)}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <CheckCircle size={14} />
              Finalizar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Controle de Transbordos"
        description="Monitoramento e execução de transbordos de carga."
        actions={
          <Button onClick={() => setIsRegisterOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4" /> Iniciar Transbordo
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
              <Label htmlFor="toggle-filters-transbordos" className="text-sm text-gray-600 cursor-pointer">
                {showFilters ? "Ocultar" : "Mostrar"}
              </Label>
              <Switch
                id="toggle-filters-transbordos"
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
                  placeholder="Buscar por contêiner, carga, lacre ou responsável..."
                  onSearch={handleSearch}
                  onClear={handleClear}
                  showClearButton={!!search}
                  initialValue={search}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Motivo</Label>
                  <MultiSelect
                    options={reasonOptions}
                    selected={selectedReasons}
                    onChange={(selected) => {
                      setSelectedReasons(selected);
                      setPage(1);
                    }}
                    placeholder="Selecione os motivos..."
                    searchPlaceholder="Buscar motivo..."
                  />
                </div>
                <div />
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
        cards={STATUS_CONFIG}
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
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar transbordos."
        emptyMessage="Nenhum transbordo encontrado para este filtro."
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

      <RegisterTransshipmentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {completingTransshipment && (
        <CompleteTransshipmentModal
          isOpen={!!completingTransshipment}
          onClose={() => setCompletingTransshipment(null)}
          transshipment={completingTransshipment}
        />
      )}

      {editingTransshipment && (
        <EditTransshipmentModal
          isOpen={!!editingTransshipment}
          onClose={() => setEditingTransshipment(null)}
          transshipment={editingTransshipment}
        />
      )}

      {viewingTransshipment && (
        <TransshipmentDetailsCard
          transshipment={viewingTransshipment}
          onClose={() => setViewingTransshipment(null)}
        />
      )}
    </div>
  );
}

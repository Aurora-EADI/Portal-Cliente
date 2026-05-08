"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  PageHeader,
  DataTable,
  Column,
  StatusCards,
  StatusCardConfig,
} from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Layers,
  Hourglass,
  ClipboardCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  Eye,
} from "lucide-react";
import {
  inspectionsService,
  type ContainerEntry,
  type Inspection,
} from "@/services/inspections/inspections.service";
import { InspecaoContainerDetail } from "./InspecaoContainerDetail";

// ── Status cards config ──────────────────────────────────────────────────────

const STATUS_CARDS: StatusCardConfig[] = [
  {
    status: "ALL",
    label: "Todos",
    icon: Layers,
    bgColor: "bg-slate-100",
    textColor: "text-slate-700",
  },
  {
    status: "pending",
    label: "Pendentes",
    icon: Hourglass,
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
  {
    status: "in_progress",
    label: "Em Inspeção",
    icon: ClipboardCheck,
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    status: "completed",
    label: "Inspecionados",
    icon: CheckCircle2,
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPermanencia(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    high:   { label: "Alta",   color: "bg-red-50 text-red-700 border-red-200" },
    medium: { label: "Média",  color: "bg-amber-50 text-amber-700 border-amber-200" },
    low:    { label: "Normal", color: "bg-gray-50 text-gray-500 border-gray-200" },
  };
  const { label, color } = cfg[priority] ?? cfg.low;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
      {label}
    </span>
  );
}

function ContainerStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    pending:     { label: "Pendente",     color: "bg-orange-100 text-orange-700 border-orange-200" },
    in_progress: { label: "Em Inspeção",  color: "bg-blue-100 text-blue-700 border-blue-200" },
    completed:   { label: "Inspecionado", color: "bg-green-100 text-green-700 border-green-200" },
  };
  const { label, color } = cfg[status] ?? { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-block ${color}`}>
      {label}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

const LIMIT = 20;

export function InspecaoContainerDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [activeStatus, setActiveStatus] = useState("pending");

  const [entries, setEntries] = useState<ContainerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [counts, setCounts] = useState<Record<string, number>>({
    ALL: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
  });

  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  // ── Fetch entries ──────────────────────────────────────────────────────────

  const fetchEntries = useCallback(
    async (opts?: { page?: number; search?: string; status?: string; removed?: boolean }) => {
      setIsLoading(true);
      setIsError(false);
      try {
        const status = opts?.status ?? activeStatus;
        const res = await inspectionsService.listContainerEntries({
          page: opts?.page ?? page,
          limit: LIMIT,
          search: (opts?.search ?? search) || undefined,
          containerStatus: status === "ALL" ? undefined : status,
        });
        setEntries(res.data);
        setTotal(res.pagination.total);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [page, search, activeStatus],
  );

  const fetchCounts = useCallback(async () => {
    try {
      const [all, pend, inProg, done] = await Promise.all([
        inspectionsService.listContainerEntries({ limit: 1 }),
        inspectionsService.listContainerEntries({ limit: 1, containerStatus: "pending" }),
        inspectionsService.listContainerEntries({ limit: 1, containerStatus: "in_progress" }),
        inspectionsService.listContainerEntries({ limit: 1, containerStatus: "completed" }),
      ]);
      const next = {
        ALL: all.pagination.total,
        pending: pend.pagination.total,
        in_progress: inProg.pagination.total,
        completed: done.pagination.total,
      };
      setCounts(next);
      return next;
    } catch {}
  }, []);

  // ── Sync with SQL Server ───────────────────────────────────────────────────

  const syncAndRefresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      await inspectionsService.findPendingContainers();
    } catch {}
    await Promise.all([fetchEntries({ page: 1 }), fetchCounts()]);
    setPage(1);
    setIsSyncing(false);
  }, [fetchEntries, fetchCounts]);

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    syncAndRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Detail panel ──────────────────────────────────────────────────────────

  const handleViewDetails = useCallback(async (containerNumber: string) => {
    setLoadingDetail(containerNumber);
    try {
      const inspRes = await inspectionsService.findAll({
        search: containerNumber,
        limit: 1,
      });
      const insp = inspRes.data[0];
      if (!insp) return;
      const full = await inspectionsService.findOne(insp.id);
      setSelectedInspection(full);
    } finally {
      setLoadingDetail(null);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBuscar = () => {
    setSearch(inputValue);
    setPage(1);
    fetchEntries({ page: 1, search: inputValue });
  };

  const handleStatusClick = (status: string) => {
    setActiveStatus(status);
    setPage(1);
    fetchEntries({ page: 1, status });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchEntries({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = search.length > 0;

  const clearAllFilters = () => {
    setSearch("");
    setInputValue("");
    setPage(1);
    fetchEntries({ page: 1, search: "" });
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<ContainerEntry>[] = [
    {
      key: "containerNumber",
      header: "Container",
      render: (e) => (
        <div className="min-w-[160px] font-mono font-semibold text-gray-900 whitespace-nowrap">
          {e.containerNumber || "—"}
        </div>
      ),
    },
    {
      key: "beneficiario",
      header: "Beneficiário",
      render: (e) => (
        <div className="min-w-[180px] text-sm text-gray-800 whitespace-nowrap">
          {e.beneficiario || "—"}
        </div>
      ),
    },
    {
      key: "carrier",
      header: "Transportadora",
      render: (e) => (
        <div className="min-w-[180px] text-sm text-gray-700 whitespace-nowrap">
          {e.carrier || "—"}
        </div>
      ),
    },
    {
      key: "motorista",
      header: "Motorista",
      render: (e) => (
        <div className="min-w-[160px] text-sm text-gray-800 whitespace-nowrap">
          {e.motorista || "—"}
        </div>
      ),
    },
    {
      key: "lacre",
      header: "Lacre",
      render: (e) => (
        <div className="min-w-[80px] text-sm font-mono text-gray-700 whitespace-nowrap">
          {e.lacre || "—"}
        </div>
      ),
    },
    {
      key: "licensePlate",
      header: "Placa Cavalo",
      render: (e) => (
        <div className="min-w-[100px] text-sm text-gray-800 whitespace-nowrap">
          {e.licensePlate || "—"}
        </div>
      ),
    },
    {
      key: "licensePlateBoogie",
      header: "Placa Prancha",
      render: (e) => (
        <div className="min-w-[100px] text-sm text-gray-700 whitespace-nowrap">
          {e.licensePlateBoogie || "—"}
        </div>
      ),
    },
    {
      key: "entryNumber",
      header: "Nº Entrada",
      render: (e) => (
        <span className="font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 text-sm whitespace-nowrap">
          {e.entryNumber}
        </span>
      ),
    },
    {
      key: "entryDate",
      header: "Entrada",
      render: (e) => (
        <div className="min-w-[110px] text-sm text-gray-700 whitespace-nowrap">
          {new Date(e.entryDate).toLocaleDateString("pt-BR")}
        </div>
      ),
    },
    {
      key: "actions" as keyof ContainerEntry,
      header: "",
      render: (e) =>
        e.containerStatus !== "pending" ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 whitespace-nowrap"
            disabled={loadingDetail === e.containerNumber}
            onClick={() => handleViewDetails(e.containerNumber)}
          >
            <Eye size={14} />
            {loadingDetail === e.containerNumber ? "Carregando..." : "Ver inspeção"}
          </Button>
        ) : null,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Painel de Vistorias"
        description="Containers sincronizados do SQL Server. Clique em 'Ver inspeção' para detalhes do registro do app mobile."
        actions={
          <Button
            onClick={syncAndRefresh}
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        }
      />

      <StatusCards
        cards={STATUS_CARDS}
        statusCounts={counts}
        activeStatus={activeStatus}
        onStatusClick={handleStatusClick}
        columns={4}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filtros
              </CardTitle>
              {hasFilters && (
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
                <Label className="text-sm font-medium mb-2 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Container, motorista, transportadora ou beneficiário..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    className="pl-10 pr-10"
                  />
                  {inputValue && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInputValue("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={clearAllFilters} disabled={!hasFilters && !inputValue}>
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button onClick={handleBuscar}>
                <Search className="w-4 h-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <DataTable
        columns={columns}
        data={entries}
        keyExtractor={(e) => e.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar containers. Verifique a conexão com o servidor."
        emptyMessage="Nenhum container encontrado para os filtros selecionados."
        rowClassName={() => ""}
        pagination={{
          page,
          total,
          limit: LIMIT,
          onPageChange: handlePageChange,
        }}
      />

      {selectedInspection && (
        <InspecaoContainerDetail
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
}

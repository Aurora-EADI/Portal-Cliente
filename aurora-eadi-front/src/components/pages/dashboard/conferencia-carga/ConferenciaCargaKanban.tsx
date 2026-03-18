"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ClipboardList, Clock, LayoutGrid, Loader2, Minimize2, Table2 } from "lucide-react";
import { useConferenciaCargaOpen } from "@/hooks/useConferenciaCarga";
import { ConferenciaCargaItem } from "@/types";
import { ConferenciaCargaAirportTable } from "./ConferenciaCargaAirportTable";
import { ConferenciaKanbanColumn, ConferenciaKanbanColumnType } from "./components/ConferenciaKanbanColumn";
import { ConferenciaKanbanFilters, ConferenciaCargaFilters } from "./components/ConferenciaKanbanFilters";

type ViewMode = "kanban" | "table";

function normalize(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase().trim();
}

function pickModalidade(value: string | null | undefined) {
  const v = (value ?? "N/A").toUpperCase().trim();
  return v || "N/A";
}

export function ConferenciaCargaKanban() {
  const { items, isLoading, isError, error, refetch, isFetching } = useConferenciaCargaOpen({ refetchInterval: 60000 });

  const [isTvMode, setIsTvMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTvControls, setShowTvControls] = useState(false);
  const [filters, setFilters] = useState<ConferenciaCargaFilters>({
    search: "",
    conferenciaIds: [],
    modalidade: "",
    cliente: "",
    despachante: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsTvMode(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isTvMode) return;

    let hideTimeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowTvControls(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setShowTvControls(false), 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [isTvMode]);

  const toggleTvMode = useCallback(async () => {
    if (!isTvMode) {
      try {
        await document.documentElement.requestFullscreen();
        setIsTvMode(true);
      } catch (err) {
        console.error("Error entering fullscreen:", err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsTvMode(false);
      } catch (err) {
        console.error("Error exiting fullscreen:", err);
      }
    }
  }, [isTvMode]);

  const conferenciaIds = useMemo(() => {
    return [...new Set(items.map((i) => String(i.conferenciaId)))].filter(Boolean).sort((a, b) => Number(a) - Number(b));
  }, [items]);

  const modalidades = useMemo(() => {
    return [...new Set(items.map((i) => pickModalidade(i.modalidade)))].filter(Boolean).sort();
  }, [items]);

  const clientes = useMemo(() => {
    return [...new Set(items.map((i) => i.cliente ?? ""))].filter(Boolean).sort();
  }, [items]);

  const despachantes = useMemo(() => {
    return [...new Set(items.map((i) => i.despachante ?? ""))].filter(Boolean).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      if (filters.search) {
        const q = normalize(filters.search);
        const blob = [
          row.conferenciaId,
          row.nLote,
          row.nDocumento,
          row.nConhecimento,
          row.cliente,
          row.despachante,
          row.representante,
          row.usuarioCadastro,
          row.modalidade,
          row.obs,
        ]
          .map(normalize)
          .join(" ");
        if (!blob.includes(q)) return false;
      }

      if (filters.conferenciaIds.length > 0) {
        if (!filters.conferenciaIds.includes(String(row.conferenciaId))) return false;
      }

      if (filters.modalidade && filters.modalidade !== "all") {
        if (pickModalidade(row.modalidade) !== filters.modalidade) return false;
      }

      if (filters.cliente && filters.cliente !== "all") {
        if ((row.cliente ?? "") !== filters.cliente) return false;
      }

      if (filters.despachante && filters.despachante !== "all") {
        if ((row.despachante ?? "") !== filters.despachante) return false;
      }

      if (filters.dateFrom) {
        const d = row.dtConferencia ? new Date(row.dtConferencia) : null;
        const from = new Date(filters.dateFrom);
        if (d && d < from) return false;
      }

      if (filters.dateTo) {
        const d = row.dtConferencia ? new Date(row.dtConferencia) : null;
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (d && d > to) return false;
      }

      return true;
    });
  }, [items, filters]);

  const columns = useMemo((): ConferenciaKanbanColumnType[] => {
    const aereo: ConferenciaCargaItem[] = [];
    const maritimo: ConferenciaCargaItem[] = [];
    const outros: ConferenciaCargaItem[] = [];

    for (const row of filteredItems) {
      const m = pickModalidade(row.modalidade);
      if (m === "AEREO") aereo.push(row);
      else if (m === "MARITIMO") maritimo.push(row);
      else outros.push(row);
    }

    return [
      { id: "maritimo", title: "Maritimo", color: "bg-blue-600", items: maritimo },
      { id: "aereo", title: "Aereo", color: "bg-amber-600", items: aereo },
      { id: "outros", title: "Outros", color: "bg-emerald-600", items: outros },
    ];
  }, [filteredItems]);

  const total = filteredItems.length;

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      conferenciaIds: [],
      modalidade: "",
      cliente: "",
      despachante: "",
      dateFrom: "",
      dateTo: "",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const ViewModeToggle = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-1 bg-gray-100 p-1 rounded-lg", className)}>
      <Button
        variant={viewMode === "kanban" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("kanban")}
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        Kanban
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("table")}
        className="gap-2"
      >
        <Table2 className="h-4 w-4" />
        Painel
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando conferencias...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || "Erro ao carregar Conferencia de Carga"}
          <Button variant="link" onClick={() => refetch()} className="ml-2 p-0 h-auto">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTvMode) {
    return (
      <div className={cn("fixed inset-0 z-50 bg-gray-900", viewMode === "kanban" ? "overflow-auto" : "overflow-hidden")}>
        <div
          className={cn(
            "fixed top-4 right-4 z-[60] flex items-center gap-4 bg-gray-800/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-700 transition-all duration-300",
            showTvControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-lg">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-2"
            >
              <Table2 className="h-4 w-4" />
              Painel
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTvMode}
            className="gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <Minimize2 className="h-4 w-4" />
            Sair TV
          </Button>
        </div>

        {viewMode === "kanban" ? (
          <>
            <div className="flex items-center justify-between p-6 mb-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <ClipboardList className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Conferencia de Carga - EADI Aurora</h1>
                  <p className="text-gray-400 text-lg">Monitoramento em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-5 w-5" />
                    <span className="text-lg">Hora atual</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-gray-500">Atualizado automaticamente</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-lg">Total</p>
                  <p className="text-3xl font-bold text-white">{total} registros</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 pb-24">
              {columns.map((column) => (
                <ConferenciaKanbanColumn key={column.id} column={column} isTvMode={isTvMode} />
              ))}
            </div>

            <div className="fixed bottom-6 left-6 right-6 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 flex items-center justify-around">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center gap-4">
                  <div className={cn("w-4 h-4 rounded-full", column.color)} />
                  <div>
                    <p className="text-gray-400 text-sm">{column.title}</p>
                    <p className="text-2xl font-bold text-white">{column.items.length}</p>
                  </div>
                </div>
              ))}
              <div className="border-l border-gray-600 pl-6">
                <p className="text-gray-400 text-sm">Total Geral</p>
                <p className="text-2xl font-bold text-white">{total}</p>
              </div>
            </div>
          </>
        ) : (
          <ConferenciaCargaAirportTable items={filteredItems} isTvMode={isTvMode} isLoading={isFetching} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Conferencia de Carga
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-gray-500">Acompanhe as conferencias em aberto</p>
        </div>
        <ViewModeToggle />
      </header>

      <ConferenciaKanbanFilters
        filters={filters}
        setFilters={setFilters}
        conferenciaIds={conferenciaIds}
        modalidades={modalidades}
        clientes={clientes}
        despachantes={despachantes}
        onReset={handleResetFilters}
        isTvMode={isTvMode}
        onToggleTvMode={toggleTvMode}
        onRefresh={handleRefresh}
        total={total}
        isRefreshing={isFetching}
      />

      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <ConferenciaKanbanColumn key={column.id} column={column} isTvMode={false} />
          ))}
        </div>
      ) : (
        <ConferenciaCargaAirportTable items={filteredItems} isTvMode={false} isLoading={isFetching} />
      )}
    </div>
  );
}

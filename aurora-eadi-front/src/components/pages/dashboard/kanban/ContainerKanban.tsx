"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { KanbanFilters as KanbanFiltersType } from "@/types";
import { useKanbanContainers } from "@/hooks/useKanbanContainers";
import { KanbanColumn } from "./components/KanbanColumn";
import { KanbanFilters } from "./components/KanbanFilters";
import { AirportTable } from "./components/AirportTable";
import { cn } from "@/lib/utils";
import { Package, Clock, LayoutGrid, Table2, Loader2, AlertCircle, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ViewMode = "kanban" | "table";

export function ContainerKanban() {
  // Busca dados da API
  const {
    columns,
    companies,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useKanbanContainers({ refetchInterval: 60000 });

  const [isTvMode, setIsTvMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTvControls, setShowTvControls] = useState(false);
  const [filters, setFilters] = useState<KanbanFiltersType>({
    search: "",
    entryNumbers: [],
    documento: "",
    containerType: "",
    status: "",
    company: "",
    dateFrom: "",
    dateTo: ""
  });

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsTvMode(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Controle de visibilidade dos controles no modo TV (aparece ao mover mouse)
  useEffect(() => {
    if (!isTvMode) return;

    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowTvControls(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        setShowTvControls(false);
      }, 3000); // Esconde após 3 segundos sem movimento
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

  // Filter containers
  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      containers: column.containers.filter(container => {
        // Search filter (Container / Placa)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            container.containerNumber.toLowerCase().includes(searchLower) ||
            container.licensePlate.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Entry numbers filter (multiselect)
        if (filters.entryNumbers.length > 0) {
          if (!filters.entryNumbers.includes(container.entryNumber)) return false;
        }

        // Documento filter
        if (filters.documento && filters.documento !== "all") {
          if (container.abreviatura !== filters.documento) return false;
        }

        // Container type filter
        if (filters.containerType && filters.containerType !== "all" as string) {
          if (container.containerType !== filters.containerType) return false;
        }

        // Status filter
        if (filters.status && filters.status !== "all" as string) {
          if (container.status !== filters.status) return false;
        }

        // Company filter
        if (filters.company && filters.company !== "all") {
          if (container.company !== filters.company) return false;
        }

        // Date range filter
        if (filters.dateFrom) {
          const containerDate = new Date(container.entryDate);
          const fromDate = new Date(filters.dateFrom);
          if (containerDate < fromDate) return false;
        }

        if (filters.dateTo) {
          const containerDate = new Date(container.entryDate);
          const toDate = new Date(filters.dateTo);
          if (containerDate > toDate) return false;
        }

        return true;
      })
    }));
  }, [columns, filters]);

  // All filtered containers for table view
  const allFilteredContainers = useMemo(() => {
    return filteredColumns.flatMap(col => col.containers);
  }, [filteredColumns]);

  const totalContainers = useMemo(() => {
    return filteredColumns.reduce((acc, col) => acc + col.containers.length, 0);
  }, [filteredColumns]);

  // Extrai lista única de documentos
  const documentos = useMemo(() => {
    const allContainers = columns.flatMap(col => col.containers);
    return [...new Set(allContainers.map(c => c.abreviatura))].filter(Boolean).sort();
  }, [columns]);

  // Extrai lista única de entradas
  const entradas = useMemo(() => {
    const allContainers = columns.flatMap(col => col.containers);
    return [...new Set(allContainers.map(c => c.entryNumber))].filter(Boolean).sort();
  }, [columns]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      entryNumbers: [],
      documento: "",
      containerType: "",
      status: "",
      company: "",
      dateFrom: "",
      dateTo: ""
    });
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // View Mode Toggle Button Component
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando containers...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || "Erro ao carregar containers do Kanban"}
          <Button variant="link" onClick={() => refetch()} className="ml-2 p-0 h-auto">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Wrapper for TV mode - uses fixed positioning to overlay entire screen
  if (isTvMode) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 bg-gray-900",
        viewMode === "kanban" ? "overflow-auto" : "overflow-hidden"
      )}>
        {/* Controles flutuantes - aparecem ao mover o mouse */}
        <div
          className={cn(
            "fixed top-4 right-4 z-[60] flex items-center gap-4 bg-gray-800/95 backdrop-blur-sm rounded-xl p-3 shadow-2xl border border-gray-700 transition-all duration-300",
            showTvControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          )}
        >
          {/* View Mode Toggle */}
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

        {/* Content based on view mode */}
        {viewMode === "kanban" ? (
          <>
            {/* TV Mode Header - apenas no Kanban */}
            <div className="flex items-center justify-between p-6 mb-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Gestao de Containers - EADI Aurora
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Monitoramento em tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-5 w-5" />
                    <span className="text-lg">Hora atual</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {currentTime.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                  <p className="text-sm text-gray-500">Atualizado automaticamente</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-lg">Total</p>
                  <p className="text-3xl font-bold text-white">
                    {totalContainers} containers
                  </p>
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 pb-24">
              {filteredColumns.map(column => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  isTvMode={isTvMode}
                />
              ))}
            </div>

            {/* Summary Stats */}
            <div className="fixed bottom-6 left-6 right-6 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 flex items-center justify-around">
              {filteredColumns.map(column => (
                <div key={column.id} className="flex items-center gap-4">
                  <div className={cn("w-4 h-4 rounded-full", column.color)} />
                  <div>
                    <p className="text-gray-400 text-sm">{column.title}</p>
                    <p className="text-2xl font-bold text-white">
                      {column.containers.length}
                    </p>
                  </div>
                </div>
              ))}
              <div className="border-l border-gray-600 pl-6">
                <p className="text-gray-400 text-sm">Total Geral</p>
                <p className="text-2xl font-bold text-white">
                  {totalContainers}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Airport Table View - sem header, apenas a tabela */
          <AirportTable containers={allFilteredContainers} isTvMode={isTvMode} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Kanban de Containers
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-gray-500">
            Acompanhe o status dos containers em tempo real
          </p>
        </div>
        {/* View Mode Toggle */}
        <ViewModeToggle />
      </header>

      {/* Filters */}
      <KanbanFilters
        filters={filters}
        setFilters={setFilters}
        companies={companies}
        documentos={documentos}
        entradas={entradas}
        onReset={handleResetFilters}
        isTvMode={isTvMode}
        onToggleTvMode={toggleTvMode}
        onRefresh={handleRefresh}
        totalContainers={totalContainers}
        isRefreshing={isFetching}
      />

      {/* Content based on view mode */}
      {viewMode === "kanban" ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredColumns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              isTvMode={false}
            />
          ))}
        </div>
      ) : (
        /* Airport Table View */
        <AirportTable containers={allFilteredContainers} isTvMode={false} />
      )}
    </div>
  );
}

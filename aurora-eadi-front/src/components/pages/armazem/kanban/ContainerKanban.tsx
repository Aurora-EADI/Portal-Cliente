"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn as KanbanColumnType, KanbanFilters as KanbanFiltersType, ContainerStatus, ContainerType } from "@/types";
import { getInitialColumns, getUniqueClients } from "./mocks/mockData";
import { KanbanColumn } from "./components/KanbanColumn";
import { KanbanFilters } from "./components/KanbanFilters";
import { cn } from "@/lib/utils";
import { Package, Clock } from "lucide-react";

export function ContainerKanban() {
  const [columns, setColumns] = useState<KanbanColumnType[]>(getInitialColumns());
  const [isTvMode, setIsTvMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filters, setFilters] = useState<KanbanFiltersType>({
    search: "",
    containerType: "",
    client: "",
    dateFrom: "",
    dateTo: "",
    priority: ""
  });

  const clients = useMemo(() => getUniqueClients(), []);

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
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            container.containerNumber.toLowerCase().includes(searchLower) ||
            container.bl.toLowerCase().includes(searchLower) ||
            container.diNumber.toLowerCase().includes(searchLower) ||
            container.client.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Container type filter
        if (filters.containerType && filters.containerType !== "all" as string) {
          if (container.containerType !== filters.containerType) return false;
        }

        // Client filter
        if (filters.client && filters.client !== "all") {
          if (container.client !== filters.client) return false;
        }

        // Priority filter
        if (filters.priority && filters.priority !== "all" as string) {
          if (container.priority !== filters.priority) return false;
        }

        // Date range filter
        if (filters.dateFrom) {
          const containerDate = new Date(container.arrivalDate);
          const fromDate = new Date(filters.dateFrom);
          if (containerDate < fromDate) return false;
        }

        if (filters.dateTo) {
          const containerDate = new Date(container.arrivalDate);
          const toDate = new Date(filters.dateTo);
          if (containerDate > toDate) return false;
        }

        return true;
      })
    }));
  }, [columns, filters]);

  const totalContainers = useMemo(() => {
    return filteredColumns.reduce((acc, col) => acc + col.containers.length, 0);
  }, [filteredColumns]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setColumns(prevColumns => {
      const newColumns = [...prevColumns];

      // Find source and destination columns
      const sourceColIndex = newColumns.findIndex(col => col.id === source.droppableId);
      const destColIndex = newColumns.findIndex(col => col.id === destination.droppableId);

      if (sourceColIndex === -1 || destColIndex === -1) return prevColumns;

      const sourceColumn = { ...newColumns[sourceColIndex] };
      const destColumn = sourceColIndex === destColIndex
        ? sourceColumn
        : { ...newColumns[destColIndex] };

      // Find the container being moved
      const containerIndex = sourceColumn.containers.findIndex(c => c.id === draggableId);
      if (containerIndex === -1) return prevColumns;

      // Remove from source
      const [movedContainer] = sourceColumn.containers.splice(containerIndex, 1);

      // Update container status
      const updatedContainer = {
        ...movedContainer,
        status: destination.droppableId as ContainerStatus
      };

      // Insert at destination
      if (sourceColIndex === destColIndex) {
        sourceColumn.containers.splice(destination.index, 0, updatedContainer);
        newColumns[sourceColIndex] = sourceColumn;
      } else {
        destColumn.containers.splice(destination.index, 0, updatedContainer);
        newColumns[sourceColIndex] = sourceColumn;
        newColumns[destColIndex] = destColumn;
      }

      return newColumns;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      containerType: "",
      client: "",
      dateFrom: "",
      dateTo: "",
      priority: ""
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setColumns(getInitialColumns());
  }, []);

  // Wrapper for TV mode - uses fixed positioning to overlay entire screen
  if (isTvMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 p-6 overflow-auto">
        {/* TV Mode Header */}
        <div className="flex items-center justify-between mb-6">
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
                <span className="text-lg">Atualizado em</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {currentTime.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-lg">Total</p>
              <p className="text-3xl font-bold text-white">
                {totalContainers} containers
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <KanbanFilters
            filters={filters}
            setFilters={setFilters}
            clients={clients}
            onReset={handleResetFilters}
            isTvMode={isTvMode}
            onToggleTvMode={toggleTvMode}
            onRefresh={handleRefresh}
            totalContainers={totalContainers}
          />
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-24">
            {filteredColumns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                isTvMode={isTvMode}
              />
            ))}
          </div>
        </DragDropContext>

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
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kanban de Containers
          </h1>
          <p className="text-gray-500">
            Acompanhe o status dos containers em tempo real
          </p>
        </div>
      </header>

      {/* Filters */}
      <KanbanFilters
        filters={filters}
        setFilters={setFilters}
        clients={clients}
        onReset={handleResetFilters}
        isTvMode={isTvMode}
        onToggleTvMode={toggleTvMode}
        onRefresh={handleRefresh}
        totalContainers={totalContainers}
      />

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredColumns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              isTvMode={false}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { PageHeader, DataTable, Column, SearchBar } from "@/components/ui/DataTable";
import { useAuditLogsList } from "@/hooks/armazem-geral/useAuditLogs";
import { WarehouseAuditLog, AuditAction } from "@/types/armazem-geral";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/Badge";
import { Eye, UserCircle, History, Filter } from "lucide-react";
import { AuditLogDetailsModal } from "./AuditLogDetailsModal";

export function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 15;

  const [selectedLog, setSelectedLog] = useState<WarehouseAuditLog | null>(null);

  const { data, isLoading, isError } = useAuditLogsList({
    page,
    limit,
    entityType: search || undefined, // Adaptando a busca por tipo de entidade por enquanto
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

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 font-bold text-[10px] uppercase tracking-tighter">CRIAR</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 font-bold text-[10px] uppercase tracking-tighter">ATUALIZAR</Badge>;
      case "DELETE":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-100 font-bold text-[10px] uppercase tracking-tighter">EXCLUIR</Badge>;
      case "STATUS_CHANGE":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100 font-bold text-[10px] uppercase tracking-tighter">STATUS</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const columns: Column<WarehouseAuditLog>[] = [
    {
      key: "createdAt",
      header: "Data e Hora",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-sm">
            {format(new Date(item.createdAt), "dd/MM/yyyy")}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {format(new Date(item.createdAt), "HH:mm:ss")}
          </span>
        </div>
      ),
    },
    {
      key: "performedByUserId",
      header: "Responsável",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100 shadow-sm">
            <UserCircle size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-sm leading-tight">
              {item.performedByUser?.name || "Sistema"}
            </span>
            <span className="text-[10px] text-gray-400 font-mono max-w-[120px] truncate" title={item.performedByUser?.email}>
              {item.performedByUser?.email || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Ação",
      align: "center",
      render: (item) => getActionBadge(item.action),
    },
    {
      key: "entityType",
      header: "Entidade",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-700 text-sm">{item.entityType}</span>
          <span className="text-[10px] text-gray-400 font-mono italic" title={item.entityId}>
            ID: {item.entityId.split("-")[0]}...
          </span>
        </div>
      ),
    },
    {
      key: "acoes",
      header: "Logs",
      align: "center",
      render: (item) => (
        <button
          onClick={() => setSelectedLog(item)}
          className="p-2 hover:bg-gray-50 text-gray-400 hover:text-primary-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white group"
          title="Ver Detalhes"
        >
          <Eye size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 p-8 pt-6">
      <PageHeader
        title="Auditoria de Movimentações"
        description="Monitoramento completo de operações sensíveis no Armazém Geral."
        actions={
          <div className="flex items-center gap-2">
             <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 text-[11px] font-bold flex items-center gap-2">
                <History size={14} /> MODO DE RASTREAMENTO ATIVO
             </div>
          </div>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Filtrar por tipo de entidade (ex: Carga, Container)..."
            onSearch={handleSearch}
            onClear={handleClear}
            showClearButton={!!search}
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 h-11 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
           <Filter size={16} className="text-gray-400" /> Filtros Avançados
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden ring-1 ring-gray-200 shadow-gray-200/50">
        <DataTable
          columns={columns}
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Erro ao carregar logs de auditoria."
          emptyMessage={search ? "Nenhum log encontrado para esta busca." : "Nenhum histórico de auditoria disponível."}
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

      <AuditLogDetailsModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}

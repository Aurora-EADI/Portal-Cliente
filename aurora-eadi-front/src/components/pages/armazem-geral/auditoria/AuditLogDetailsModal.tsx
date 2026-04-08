"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WarehouseAuditLog } from "@/types/armazem-geral";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/Badge";
import { FileText, User, Calendar, Activity, Database } from "lucide-react";

interface AuditLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: WarehouseAuditLog | null;
}

export function AuditLogDetailsModal({
  isOpen,
  onClose,
  log,
}: AuditLogDetailsModalProps) {
  if (!log) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">CRIAÇÃO</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">ATUALIZAÇÃO</Badge>;
      case "DELETE":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">EXCLUSÃO</Badge>;
      case "STATUS_CHANGE":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">MUDANÇA DE STATUS</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-gray-50 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <FileText className="text-primary-500" size={24} />
              Detalhes da Auditoria
            </DialogTitle>
            {getActionBadge(log.action)}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Database size={14} /> Contexto da Entidade
                </h3>
                <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Tipo de Entidade</label>
                    <p className="font-semibold text-gray-800">{log.entityType}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">ID da Entidade</label>
                    <p className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 break-all">{log.entityId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} /> Registro de Execução
                </h3>
                <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100">
                       <User size={14} className="text-primary-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Usuário Responsável</label>
                      <p className="font-semibold text-gray-800">{log.performedByUser?.name || "Sistema"}</p>
                      <p className="text-xs text-gray-500 font-mono italic">{log.performedByUser?.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                       <Calendar size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Data e Hora</label>
                      <p className="font-semibold text-gray-800">
                        {format(new Date(log.createdAt), "PPP 'às' p", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparação JSON */}
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Alterações de Dados</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Antes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">ESTADO ANTERIOR</span>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 shadow-inner min-h-[150px]">
                      {log.before ? (
                        <pre className="text-[11px] font-mono text-gray-300 leading-relaxed overflow-auto max-h-[300px]">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                           <p className="text-xs text-gray-500 italic">Nenhum dado anterior (Criação)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Depois */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-100">NOVO ESTADO</span>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 shadow-inner min-h-[150px]">
                      {log.after ? (
                        <pre className="text-[11px] font-mono text-gray-300 leading-relaxed overflow-auto max-h-[300px]">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                           <p className="text-xs text-gray-500 italic">Entidade removida</p>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 bg-gray-50 border-t shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

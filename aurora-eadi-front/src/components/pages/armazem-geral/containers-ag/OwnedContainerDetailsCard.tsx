import React from 'react';
import { WarehouseOwnedContainer, WarehouseOwnedContainerStatus } from '@/types/armazem-geral';
import { Package, X, Construction, CheckCircle, Clock, AlertTriangle, Calendar, Trash2, Loader2, Info, FileText, Hash, Truck, MapPin, Clipboard, Boxes } from 'lucide-react';
import { useOwnedContainerDetail } from '@/hooks/armazem-geral/useOwnedContainers';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OwnedContainerDetailsCardProps {
  container: WarehouseOwnedContainer;
  onClose: () => void;
  onDelete: () => void;
}

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Disponível', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  IN_USE: { label: 'Em Uso', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  MAINTENANCE: { label: 'Em Manutenção', icon: Construction, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  DAMAGED: { label: 'Danificado', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  WITH_CUSTOMER: { label: 'Com Cliente', icon: Truck, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
};

export function OwnedContainerDetailsCard({ container, onClose, onDelete }: OwnedContainerDetailsCardProps) {
  const { data: details, isLoading } = useOwnedContainerDetail(container.id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusInfo = STATUS_CONFIG[container.status as WarehouseOwnedContainerStatus] || STATUS_CONFIG.AVAILABLE;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
          <div className="flex gap-5 items-center text-left">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-md">
              <Package size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{container.containerNumber || container.code}</h2>
                <span className={cn(
                    "px-3 py-1 text-[10px] font-black rounded-full border flex items-center gap-1.5",
                    details?.isFull ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"
                )}>
                    <Boxes size={12} /> {details?.isFull ? 'CHEIO' : 'VAZIO'}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 text-[9px] font-black bg-primary-600 text-white rounded-md tracking-widest uppercase">
                  Frota AG
                </span>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border flex items-center gap-1 tracking-widest uppercase ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                  <StatusIcon size={12} /> {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent text-left">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
              <p className="font-medium">Sincronizando dados do ativo...</p>
            </div>
          ) : details ? (
            <>
              {/* Grid de Informações */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <Hash size={12} className="text-primary-500" /> 1) Nº Contêiner
                   </Label>
                   <div className="text-base font-bold text-gray-900 px-1">{details.containerNumber || "N/A"}</div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <Truck size={12} className="text-primary-500" /> 2) Fornecedor
                   </Label>
                   <div className="text-base font-bold text-gray-900 px-1">{details.supplier?.fantasyName || "N/A"}</div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <FileText size={12} className="text-primary-500" /> 4) Cliente Atual
                   </Label>
                   <div className="text-base font-bold text-gray-900 px-1">
                     {details.holderCustomer?.name || (details.status === "WITH_CUSTOMER" ? "N/A" : "-")}
                   </div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <Package size={12} className="text-primary-500" /> 3) Tamanho
                   </Label>
                   <div className="text-base font-bold text-gray-900 px-1">{details.containerType || "N/A"}</div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <MapPin size={12} className="text-primary-500" /> 5) Localização
                   </Label>
                   <div className="text-base font-bold text-gray-900 px-1">
                     {details.status === "WITH_CUSTOMER" ? "COM CLIENTE" : (details.location || "PÁTIO GERAL")}
                   </div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <Clipboard size={12} className="text-gray-400" /> Código Interno
                   </Label>
                   <div className="text-sm font-semibold text-gray-600 px-1">{details.code}</div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2">
                      <Calendar size={12} className="text-gray-400" /> Registro
                   </Label>
                   <div className="text-sm font-semibold text-gray-600 px-1">{formatDate(details.createdAt)}</div>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* 6) Avaria */}
                 <div className="p-5 rounded-2xl border bg-red-50/50 border-red-100 col-span-1 md:col-span-2">
                    <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} /> 6) Avarias Identificadas
                    </h3>
                    {details.damages && details.damages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {details.damages.map((d: any, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-white text-red-700 text-[10px] font-black rounded-lg border border-red-100 shadow-sm uppercase tracking-tight">
                            {d.description.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 font-medium font-sans italic">Nenhuma avaria registrada no momento.</p>
                    )}
                 </div>

                 {/* 7) Observação */}
                 <div className="p-5 rounded-2xl border bg-indigo-50/30 border-indigo-100 col-span-1 md:col-span-2">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText size={14} /> 7) Observação
                    </h3>
                    {details.observations ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {details.observations}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic font-sans font-medium">Sem observações adicionais.</p>
                    )}
                 </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic">
                  Última sincronização: {formatDate(details.updatedAt)}
                </p>
                <button
                  onClick={onDelete}
                  className="px-5 py-2.5 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 border border-red-100 hover:border-red-600 shadow-sm"
                >
                  <Trash2 size={16} />
                  REMOVER ATIVO
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-red-500 py-10 font-bold">Erro fatal ao carregar dados do ativo.</div>
          )}
        </div>
      </div>
    </div>
  );
}

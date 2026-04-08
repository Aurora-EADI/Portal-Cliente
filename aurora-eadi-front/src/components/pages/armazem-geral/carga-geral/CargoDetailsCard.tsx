import React from 'react';
import { WarehouseCargo } from '@/types/armazem-geral';
import { Box, X, MapPin, Package, FileText, AlertOctagon, Calendar, Trash2, Loader2, Weight, User, Ruler, Truck, AlertTriangle } from 'lucide-react';
import { useCargoDetail } from '@/hooks/armazem-geral/useCargo';

interface CargoDetailsCardProps {
  cargo: WarehouseCargo;
  onClose: () => void;
  onDelete: () => void;
}

export function CargoDetailsCard({ cargo, onClose, onDelete }: CargoDetailsCardProps) {
  const { data: details, isLoading } = useCargoDetail(cargo.id);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{cargo.description}</h2>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 uppercase tracking-tight">
                  ID: {cargo.id.split('-')[0]}
                </span>
                {cargo.dangerous && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full border border-red-200 uppercase tracking-tight flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> PERIGOSA (IMO)
                  </span>
                )}
                {details?.location && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-100 uppercase tracking-tight flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {details.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
              <p>Carregando detalhes...</p>
            </div>
          ) : details ? (
            <>
              {/* Cliente e Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <div className="flex items-center gap-2 text-primary-400 mb-1">
                    <User size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cliente / Importador</span>
                  </div>
                  <span className="text-sm font-bold text-primary-900 leading-tight">
                    {details.customer?.name || details.customer?.corporateName || "Não Atribuído"}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <FileText size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Documento</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {details.documentNumber && !details.documentNumber.includes('## Error Type') ? (
                      `${details.documentType === 'DI' ? 'DI' : 'NR'}: ${details.documentNumber}`
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
              </div>

              {/* Informações Físicas */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Package size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Embalagem</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {
                        (details.packagingType || details.cargoType) === 'BOXES' ? 'CAIXARIA' :
                        (details.packagingType || details.cargoType) === 'PALLETIZED' ? 'PALETIZADA' :
                        (details.packagingType || details.cargoType) === 'LOOSE' ? 'SOLTA' :
                        (details.packagingType || details.cargoType) || "---"
                    }
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Box size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Qtd</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{details.quantity} vol</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Weight size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Peso</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{details.weightKg ? `${details.weightKg} kg` : "---"}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Ruler size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Volume</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{details.volume ? `${details.volume} m³` : "---"}</span>
                </div>
              </section>

              {/* Informações Logísticas */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={14} />
                  Fluxo Logístico
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                    <div className="text-[10px] font-bold text-green-600 uppercase mb-2">Entrada</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Data:</span>
                        <span className="font-semibold">{formatDate(details.entryDate)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Container:</span>
                        <span className="font-semibold">{details.entryContainer?.containerNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                    <div className="text-[10px] font-bold text-red-600 uppercase mb-2">Saída</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Data:</span>
                        <span className="font-semibold">{formatDate(details.exitDate)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Container:</span>
                        <span className="font-semibold">{details.exitContainer?.containerNumber || "---"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contêiner Atual */}
              <section className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Package size={14} />
                  Vínculo Atual Pátio
                </h3>
                {details.container ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{details.container.containerNumber}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Status: {details.container.status === 'IN_WAREHOUSE' ? 'Em Pátio' : details.container.status}</div>
                    </div>
                    <div className="text-primary-600 bg-primary-50 px-3 py-1 rounded-lg text-xs font-bold border border-primary-100">
                      EM CONTÊINER
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <AlertOctagon size={16} className="shrink-0" />
                    <span className="text-xs font-medium italic">Esta carga está no armazém (solta).</span>
                  </div>
                )}
              </section>

              {/* Vistoria / Avarias */}
              {details.damages && details.damages.length > 0 && (
                <section className="p-4 bg-red-50 border border-red-100 rounded-xl">
                   <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Avarias Registradas
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {details.damages.map((dmg) => (
                      <span key={dmg.id} className="px-2 py-1 bg-white border border-red-200 text-red-700 text-[10px] font-bold rounded shadow-sm">
                        {dmg.description.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Auditoria / Metadata */}
              <section className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-[10px] text-gray-400 italic">
                  Criado em: {formatDateTime(details.createdAt)}
                </p>
                <p className="text-[10px] text-gray-400 italic">
                  Última atualização: {formatDateTime(details.updatedAt)}
                </p>
              </section>

              {/* Actions Footer */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={onDelete}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border border-transparent hover:border-red-100"
                >
                  <Trash2 size={16} />
                  Excluir Registro
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-red-500 py-6">Erro ao carregar detalhes</div>
          )}
        </div>
      </div>
    </div>
  );
}

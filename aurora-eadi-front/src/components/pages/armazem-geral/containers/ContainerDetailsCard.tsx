import React from 'react';
import { OperationalContainer } from '@/types/armazem-geral';
import { Package, X, MapPin, Building2, Truck, Calendar, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { useContainerDetail } from '@/hooks/armazem-geral/useContainers';

interface ContainerDetailsCardProps {
  container: OperationalContainer;
  onClose: () => void;
}

export function ContainerDetailsCard({ container, onClose }: ContainerDetailsCardProps) {
  const { data: details, isLoading } = useContainerDetail(container.id);

  const formatDamage = (value: string) => {
    const labels: Record<string, string> = {
      AMASSADO_ESTRUTURA: "Amassado (Estrutura)",
      FURO_ESTRUTURA: "Furo (Estrutura)",
      CORTE_ESTRUTURA: "Corte (Estrutura)",
      EMPENADO_ESTRUTURA: "Empenado (Estrutura)",
      TRANCA_DANIFICADA: "Tranca Danificada",
      BORRACHA_SOLTA: "Borracha Solta",
      DOBRADICA_QUEBRADA: "Dobradiça Quebrada",
      PISO_MADEIRA_PODRE: "Piso Madeira Podre",
      PISO_SUJO: "Piso Sujo",
      PISO_OLEO: "Mancha de Óleo",
      PISO_FURO: "Furo no Piso",
      TETO_FURO: "Furo no Teto",
      TETO_AMASSADO: "Amassado Superior",
    };

    if (labels[value]) return labels[value];
    
    // Fallback: Title Case and remove underscores
    return value
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'IN_WAREHOUSE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OUT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'TRANSSHIPMENT': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_WAREHOUSE': return 'Em Pátio';
      case 'OUT': return 'Saída';
      case 'TRANSSHIPMENT': return 'Em Transbordo';
      default: return status;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'ENTRY': return 'Entrada';
      case 'EXIT': return 'Saída';
      case 'LOCATION_UPDATE': return 'Mudança de Local';
      case 'STATUS_CHANGE': return 'Mudança de Status';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{container.containerNumber}</h2>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(container.status)}`}>
                  {getStatusLabel(container.status)}
                </span>
                {container.containerType && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {container.containerType}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Ficha Completa do Contêiner</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
              <p>Carregando histórico do contêiner...</p>
            </div>
          ) : details ? (
            <>
              {/* Informações Atuais */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Posição Atual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 block uppercase tracking-wider">Localização Física</span>
                      <span className="text-sm font-semibold text-gray-900 mt-1 block">
                        {details.location || 'Não designada'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 block uppercase tracking-wider">Cliente Vinculado</span>
                      <span className="text-sm font-semibold text-gray-900 mt-1 block">
                        {details.customer ? details.customer.name : 'Sem vínculo'}
                      </span>
                      {details.customer && <span className="text-xs text-gray-400">{details.customer.document}</span>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                      <span className="text-[10px] font-bold">LC</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 block uppercase tracking-wider">Lacre de Origem</span>
                      <span className="text-sm font-semibold text-gray-900 mt-1 block">
                        {details.originalSeal || 'Não informado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 lg:col-span-1 md:col-span-2">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-gray-500 block uppercase tracking-wider">Primeiro Registro</span>
                      <span className="text-sm font-semibold text-gray-900 mt-1 block">
                        {formatDate(details.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Histórico Operacional */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                  Histórico Operacional ({details.movements?.length || 0})
                </h3>
                
                <div className="space-y-4">
                  {details.movements && details.movements.length > 0 ? (
                    <div className="relative border-l-2 border-gray-200 ml-3 md:ml-4 space-y-6 pb-4">
                      {details.movements.map((mov, index) => {
                        const isLatest = index === 0;
                        return (
                          <div key={mov.id} className="relative pl-6 md:pl-8">
                            {/* Timeline dot */}
                            <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${isLatest ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-gray-300'}`}></span>
                            
                            <div className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${isLatest ? 'border-primary-200' : 'border-gray-100'}`}>
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 cursor-default">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider ${
                                    mov.type === 'ENTRY' ? 'bg-green-100 text-green-700' :
                                    mov.type === 'EXIT' ? 'bg-red-100 text-red-700' :
                                    'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {getMovementLabel(mov.type)}
                                  </span>
                                  {mov.location && (
                                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {mov.location}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 gap-1.5 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDate(mov.createdAt)}
                                </div>
                              </div>

                              {/* Transito info */}
                              {(mov.carrier || mov.driver || mov.vehicle) && (
                                <div className="mt-3 bg-gray-50 p-3 rounded-lg flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 border border-gray-100">
                                  {mov.carrier && (
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Transportadora</span>
                                      <span className="font-medium text-gray-800">{mov.carrier.name}</span>
                                    </div>
                                  )}
                                  {mov.driver && (
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Motorista</span>
                                      <span className="font-medium text-gray-800">{mov.driver.name}</span>
                                    </div>
                                  )}
                                  {mov.vehicle && (
                                    <div className="flex items-center gap-1.5 mt-1 border border-gray-200 px-2 py-0.5 rounded font-mono text-xs bg-white shadow-sm font-bold h-fit self-end">
                                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                                      {mov.vehicle.plate}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 border-t border-gray-50 pt-3">
                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center font-bold text-[10px]">
                                  {mov.performedByUser?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span>Responsável: <span className="font-medium text-gray-600">{mov.performedByUser?.name || 'Sistema'}</span></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Nenhuma movimentação registrada.
                    </div>
                  )}
                </div>
              </section>

              {/* Avarias */}
              {details.damages && details.damages.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Avarias Identificadas ({details.damages.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {details.damages.map((damage) => (
                      <div key={damage.id} className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-900 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="font-medium">{formatDamage(damage.description)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-center text-red-500 py-6">Erro ao carregar detalhes</div>
          )}
        </div>
      </div>
    </div>
  );
}

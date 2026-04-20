'use client';

import React, { useState } from 'react';
import {
  X, MapPin, User, Calendar, Truck, Package, CheckCircle,
  XCircle, Minus, ChevronDown, ChevronRight, Image as ImageIcon,
  PenLine, AlertTriangle, Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Inspection, InspectionSide, InspectionItem } from '@/services/inspections/inspections.service';
import { exportInspecaoToPDF } from '@/services/pdfService';

interface Props {
  inspection: Inspection;
  onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-200' },
};

function ItemStatusIcon({ status }: { status: string | null }) {
  if (status === 'ok' || status === 'OK') return <CheckCircle size={16} className="text-green-500" />;
  if (status === 'nok' || status === 'NOK') return <XCircle size={16} className="text-red-500" />;
  return <Minus size={16} className="text-gray-400" />;
}

function PhotoGallery({ photos, title }: { photos: { id: string; url: string | null; fileName: string }[]; title?: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const valid = photos.filter(p => p.url);
  if (valid.length === 0) return null;

  return (
    <div>
      {title && <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>}
      <div className="flex flex-wrap gap-2">
        {valid.map(photo => (
          <button
            key={photo.id}
            onClick={() => setLightbox(photo.url!)}
            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-all shadow-sm"
          >
            <img src={photo.url!} alt={photo.fileName} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          <img src={lightbox} alt="Foto ampliada" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function SideCard({ side }: { side: InspectionSide }) {
  const [open, setOpen] = useState(true);
  const totalItems = side.itens.length;
  const okItems = side.itens.filter(i => i.status === 'ok' || i.status === 'OK').length;
  const nokItems = side.itens.filter(i => i.status === 'nok' || i.status === 'NOK').length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800">{side.lado}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${side.inspecionado ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {side.inspecionado ? 'Inspecionado' : 'Não inspecionado'}
          </span>
          <span className="text-xs text-gray-500">{totalItems} iten(s)</span>
          {okItems > 0 && <span className="text-xs text-green-600 font-medium">{okItems} OK</span>}
          {nokItems > 0 && <span className="text-xs text-red-600 font-medium">{nokItems} NOK</span>}
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {open && side.itens.length > 0 && (
        <div className="divide-y divide-gray-100">
          {side.itens.map((item: InspectionItem) => (
            <div key={item.id} className="px-5 py-4 space-y-3">
              {/* Nome + status */}
              <div className="flex items-center gap-3">
                <ItemStatusIcon status={item.status} />
                <span className="font-semibold text-gray-900 text-sm">{item.nome}</span>
                {item.posicao && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.posicao}</span>
                )}
              </div>

              {/* Tipo da avaria */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Tipo da avaria</p>
                {item.avarias && item.avarias.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.avarias.map((avaria, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                        <AlertTriangle size={10} />
                        {avaria}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhuma avaria registrada</p>
                )}
              </div>

              {/* Observação */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Observação</p>
                {item.observacao ? (
                  <p className="text-xs text-gray-700 bg-gray-50 rounded px-3 py-2 border border-gray-100">{item.observacao}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sem observação</p>
                )}
              </div>

              {/* Fotos */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Fotos</p>
                {item.fotos && item.fotos.length > 0 ? (
                  <PhotoGallery photos={item.fotos} />
                ) : (
                  <p className="text-xs text-gray-400 italic">Sem fotos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && side.itens.length === 0 && (
        <div className="px-5 py-4 text-sm text-gray-400 italic">Nenhum item registrado neste lado.</div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

export function InspecaoContainerDetail({ inspection, onClose }: Props) {
  const status = STATUS_MAP[inspection.inspectionStatus] ?? { label: inspection.inspectionStatus, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  const fotosGerais = (inspection.fotos ?? []).filter(f => !f.itemId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

        {/* Header fixo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-primary-600" />
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{inspection.containerNumero}</h2>
              <p className="text-xs text-gray-500">{inspection.containerType}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportInspecaoToPDF(inspection)} className="gap-2">
              <Printer className="w-4 h-4" />
              Exportar PDF
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">

          {/* Cabeçalho resumo */}
          <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={16} className="text-gray-400 shrink-0" />
              <span className="truncate">{inspection.user?.name ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <span>{new Date(inspection.dataHora).toLocaleString('pt-BR')}</span>
            </div>
            {(inspection.gpsLat && inspection.gpsLng) ? (
              <a
                href={`https://www.google.com/maps?q=${inspection.gpsLat},${inspection.gpsLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <MapPin size={16} className="shrink-0" />
                Ver no mapa
              </a>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={16} className="shrink-0" />
                Sem GPS
              </div>
            )}
          </div>

          {/* Dados Gerais */}
          <section>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Truck size={16} className="text-primary-600" />
              Dados Gerais
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white border border-gray-200 rounded-xl p-4">
              <InfoField label="Tipo de Operação" value={inspection.tipoOperacao} />
              <InfoField label="Status Container" value={inspection.statusContainer} />
              <InfoField label="Condição" value={inspection.condicaoContainer} />
              <InfoField label="Origem" value={inspection.origem} />
              <InfoField label="Destino" value={inspection.destino} />
              <InfoField label="Transportadora" value={inspection.transportadora} />
              <InfoField label="Motorista" value={inspection.motorista} />
              <InfoField label="CPF" value={inspection.cpf} />
              <InfoField label="Placa Cavalo" value={inspection.placaCavalo} />
              <InfoField label="Placa Prancha" value={inspection.placaPrancha} />
              <InfoField label="Lacre" value={inspection.lacre} />
              <InfoField label="Localização Armazenagem" value={inspection.localizacaoArmazenagem} />
            </div>
            {inspection.observacaoGeral && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 font-medium mb-0.5">Observação Geral</p>
                <p className="text-sm text-amber-900">{inspection.observacaoGeral}</p>
              </div>
            )}
          </section>

          {/* Checklist por Lado */}
          {inspection.lados && inspection.lados.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-primary-600" />
                Checklist por Lado
              </h3>
              <div className="space-y-3">
                {inspection.lados.map((side: InspectionSide) => (
                  <SideCard key={side.id} side={side} />
                ))}
              </div>
            </section>
          )}

          {/* Fotos Gerais */}
          {fotosGerais.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon size={16} className="text-primary-600" />
                Fotos Gerais ({fotosGerais.length})
              </h3>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <PhotoGallery photos={fotosGerais} />
              </div>
            </section>
          )}

          {/* Assinatura */}
          <section>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <PenLine size={16} className="text-primary-600" />
              Assinatura
            </h3>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-center min-h-[120px]">
              {inspection.assinatura ? (
                <div
                  className="max-h-40 max-w-full overflow-hidden [&_svg]:max-h-40 [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: inspection.assinatura }}
                />
              ) : (
                <p className="text-sm text-gray-400 italic">Sem assinatura registrada</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

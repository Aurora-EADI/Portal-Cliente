'use client';

import React, { useState } from 'react';
import { Search, AlertTriangle, FileText, CheckCircle, Weight, ShieldAlert } from 'lucide-react';
import { DI, Agendamento } from '@/types/agendamento';

interface DIStepProps {
  dis: DI[];
  activeBookings: Agendamento[];
  selectedDI: DI | null;
  onSelectDI: (di: DI | null) => void;
  onNext: () => void;
}

export function DIStep({ dis, activeBookings, selectedDI, onSelectDI, onNext }: DIStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  const filteredDIs = dis.filter((di) => {
    const matchesSearch =
      di.numeroDI.toLowerCase().includes(searchTerm.toLowerCase()) ||
      di.container.toLowerCase().includes(searchTerm.toLowerCase());
    return showOnlyAvailable ? di.status === 'liberada' && matchesSearch : matchesSearch;
  });

  const getDIActiveBooking = (diId: string): Agendamento | undefined =>
    activeBookings.find((bk) => bk.diId === diId);

  return (
    <div className="space-y-6">
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:p-5 flex items-start gap-4">
        <div className="bg-sky-50 text-sky-700 p-2 rounded-lg"><FileText className="w-5 h-5" /></div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Retirada FCL - Seleção de Documento (DI)</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Selecione a Declaração de Importação (DI) liberada. Apenas DIs com status <span className="text-emerald-700 font-semibold">"liberada"</span> podem receber agendamento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Nº DI ou container..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors flex items-center gap-1.5 shrink-0 ${showOnlyAvailable ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
            >
              {showOnlyAvailable ? 'Apenas Liberadas' : 'Ver Todas'}
            </button>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredDIs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-zinc-150 flex flex-col items-center justify-center p-6">
                <ShieldAlert className="w-8 h-8 text-zinc-400 mb-2" />
                <p className="text-sm font-medium text-zinc-700">Nenhuma DI encontrada</p>
              </div>
            ) : (
              filteredDIs.map((di) => {
                const activeBooking = getDIActiveBooking(di.id);
                const isSelected = selectedDI?.id === di.id;
                const isBlocked = di.status !== 'liberada';
                const hasBooking = !!activeBooking;
                const isDisabled = isBlocked || hasBooking;

                return (
                  <div
                    key={di.id}
                    onClick={() => { if (!isDisabled) onSelectDI(di); }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative
                      ${isSelected ? 'bg-sky-50/70 border-sky-500 ring-1 ring-sky-500'
                        : isDisabled ? 'bg-zinc-50 border-zinc-200 opacity-65 cursor-not-allowed'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm'}
                    `}
                  >
                    <div className="absolute right-4 top-4 flex items-center gap-1.5">
                      {isBlocked ? (
                        <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-150 uppercase">Bloqueada</span>
                      ) : hasBooking ? (
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-150 uppercase">Já Agendada</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-150 uppercase">Liberada</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono font-semibold text-zinc-400">DECLARAÇÃO DE IMPORTAÇÃO</div>
                      <h4 className="text-sm font-bold text-zinc-900">DI {di.numeroDI}</h4>
                      <div className="mt-3">
                        <span className="text-[10px] text-zinc-400 block">Container Vinculado</span>
                        <span className="text-xs font-mono font-bold text-sky-800 block">{di.container} ({di.tipoContainer})</span>
                      </div>
                      {hasBooking && (
                        <div className="mt-3 pt-2 border-t border-dashed border-zinc-200 text-[11px] text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Agendamento ativo: {activeBooking.data} às {activeBooking.horario}</span>
                        </div>
                      )}
                      {isBlocked && (
                        <div className="mt-3 pt-2 border-t border-dashed border-red-200 text-[11px] text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Bloqueio fiscal/documental. Entre em contato com a Receita Federal.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: confirmation */}
        <div className="lg:col-span-5">
          {selectedDI ? (
            <div className="bg-white border border-zinc-250 rounded-xl overflow-hidden shadow-sm sticky top-4 flex flex-col">
              <div className="bg-sky-950 text-white p-4 md:p-5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sky-300">Passo 1 de 3 / Confirmação</span>
                <h4 className="text-base font-bold mt-1">Dados do Container Vinculado</h4>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block uppercase">Nº Container FCL</label>
                  <p className="text-xl font-mono font-bold text-sky-900 tracking-wide mt-0.5">{selectedDI.container}</p>
                  <span className="inline-block bg-sky-50 text-sky-800 text-[11px] font-medium px-2 py-0.5 rounded-md mt-1">{selectedDI.tipoContainer}</span>
                </div>
                <div className="border-t border-zinc-100" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">Declaração de Importação</span>
                    <span className="text-sm font-bold text-zinc-800">{selectedDI.numeroDI}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">Peso Bruto Estimado</span>
                    <span className="text-sm font-bold text-zinc-800 flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{selectedDI.pesoBruto.toLocaleString('pt-BR')} kg</span>
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Mercadoria Declarada</span>
                  <p className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-150 rounded-lg p-2.5 font-medium leading-relaxed mt-1">{selectedDI.mercadoria}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Importador / Consignatário</span>
                  <span className="text-xs font-semibold text-zinc-800">{selectedDI.cliente}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Container liberado para agendamento</p>
                    <p className="text-emerald-700 mt-0.5 text-[11px]">O despachamento fiscal está quitado. Clique abaixo para prosseguir.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onNext}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2 mt-4"
                >
                  Confirmar e Avançar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="bg-zinc-100 text-zinc-400 p-3.5 rounded-full mb-3"><FileText className="w-7 h-7" /></div>
              <p className="text-sm font-semibold text-zinc-700">Nenhuma DI Selecionada</p>
              <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">Escolha uma Declaração de Importação disponível na lista para visualizar os dados do container.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Trash2, AlertCircle, Eye, Calendar, Clock, Truck, PackageOpen, Building2 } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { SuccessVoucher } from './steps/SuccessVoucher';
import { Agendamento } from '@/types/agendamento';

export function PortariaView() {
  const { visibleDis, visibleBookings, selectedClient, handleCancelBooking, viewingArchiveBooking, setViewingArchiveBooking } = useAgendamento();

  const clientBookings = visibleBookings;
  const totLiberadas = visibleDis.filter(d => d.status === 'liberada').length;

  const formatReadableDate = (ds: string) => {
    if (!ds) return '';
    const [y, m, d] = ds.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-base font-extrabold text-zinc-900">Mapeamento em Tempo Real - Portaria (EADI Gate)</h2>
        <p className="text-xs text-zinc-500 mt-1">Pesquise, consulte e imprima as guias de tráfego emitidas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookings list */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Painel de Monitoramento (EADI Gate)</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Gestão em tempo real de agendamentos autorizados</p>
              </div>
              <span className="text-[11px] bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-150">
                {clientBookings.length} {clientBookings.length === 1 ? 'Agendamento' : 'Agendamentos'}
              </span>
            </div>

            <div className="p-4">
              {clientBookings.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center text-zinc-400 p-4">
                  <PackageOpen className="w-8 h-8 text-zinc-300 mb-2" />
                  <p className="text-xs font-semibold text-zinc-500">Sem agendamentos ativos no momento</p>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">Inicie o fluxo de agendamento para reservar uma doca.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {clientBookings.map((bk) => (
                    <BookingCard key={bk.id} bk={bk} onView={(b) => setViewingArchiveBooking(b)} onCancel={handleCancelBooking} formatDate={formatReadableDate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar stats */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3.5">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest block">Seu Portfólio Logístico</h4>
            <div className="space-y-2.5 text-xs text-zinc-500">
              <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-lg flex justify-between items-center">
                <span>DIs Desembaraçadas</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">{totLiberadas}</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-lg flex justify-between items-center">
                <span>Agendamentos Ativos</span>
                <span className="font-mono font-bold text-[#ED6A23] text-sm">{clientBookings.length}</span>
              </div>
            </div>
            <div className="bg-sky-50 text-[10px] p-3 text-sky-800 rounded-lg leading-relaxed flex gap-2">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
              <p><span className="font-bold">Guarita Integrada:</span> O QR Code gerado valida a liberação aduaneira em menos de 2 segundos.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Voucher modal */}
      {viewingArchiveBooking && (
        <div className="fixed inset-0 bg-[#050814]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-zinc-200 overflow-hidden shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-150">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900">Visualização de Guia de Porta</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Protocolo: {viewingArchiveBooking.protocolo}</p>
              </div>
              <button
                onClick={() => setViewingArchiveBooking(null)}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
            <SuccessVoucher booking={viewingArchiveBooking} onReset={() => setViewingArchiveBooking(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ bk, onView, onCancel, formatDate }: { bk: Agendamento; onView: (b: Agendamento) => void; onCancel: (id: string) => void; formatDate: (s: string) => string }) {
  return (
    <div className="bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl p-3.5 flex flex-col gap-3 transition-all text-xs">
      <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
        <div>
          <span className="text-[9px] font-mono text-zinc-400 block uppercase">Protocolo emitido</span>
          <span className="font-mono font-bold text-sky-950 text-xs">{bk.protocolo}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onView(bk)} className="p-1 px-2 border border-zinc-200 bg-white hover:bg-sky-50 hover:text-sky-700 rounded-md transition-colors font-medium flex items-center gap-1 text-[10.5px]">
            <Eye className="w-3.5 h-3.5" /> <span>Visualizar</span>
          </button>
          <button type="button" onClick={() => { if (confirm(`Cancelar agendamento do container ${bk.container}?`)) onCancel(bk.id); }}
            className="p-1 px-2 border border-red-150 bg-white hover:bg-red-50 hover:text-red-700 text-zinc-500 rounded-md transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-medium">DI e Container</span>
          <p className="font-semibold text-zinc-800">DI {bk.diNumero}</p>
          <p className="font-mono text-[10.5px] text-sky-800 font-semibold">{bk.container}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-medium">Saída Programada</span>
          <p className="font-semibold text-emerald-800 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span>{formatDate(bk.data)}</span>
          </p>
          <p className="font-semibold text-zinc-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> <span>{bk.horario}</span>
          </p>
        </div>
      </div>
      <div className="bg-white/80 border border-zinc-150 rounded-lg p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <p className="font-semibold text-zinc-800 text-[11px] truncate max-w-[130px]">{bk.motorista.nome}</p>
            <p className="text-[9.5px] text-zinc-400">CPF: {bk.motorista.cpf}</p>
          </div>
        </div>
        <div className="font-mono text-[10px] font-bold bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
          {bk.veiculo?.placa}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[9.5px] text-zinc-400">
        <AlertCircle className="w-3 h-3 text-zinc-300" />
        <span>Apresentar em guarita. Tolerância 20min.</span>
      </div>
    </div>
  );
}

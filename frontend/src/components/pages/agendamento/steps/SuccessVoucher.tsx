'use client';

import React from 'react';
import { Agendamento } from '@/types/agendamento';
import {
  CheckCircle2, Printer, Download, AlertCircle,
  CornerDownLeft, CalendarDays, User, Truck, Package, Clock,
} from 'lucide-react';

interface SuccessVoucherProps {
  booking: Agendamento;
  onReset: () => void;
}

function Field({ label, value, mono = false, highlight = false }: {
  label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`text-sm font-bold leading-snug ${mono ? 'font-mono' : ''} ${highlight ? 'text-emerald-700' : 'text-zinc-800'}`}>
        {value}
      </p>
    </div>
  );
}

export function SuccessVoucher({ booking, onReset }: SuccessVoucherProps) {
  const fmt = (ds: string) => { const [y,m,d] = ds.split('-'); return `${d}/${m}/${y}`; };
  const hora = booking.horario?.split(' ')[0] ?? booking.horario;

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── Ticket card ── */}
      <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 overflow-visible">

        {/* Header strip */}
        <div className="bg-emerald-600 rounded-t-2xl px-6 pt-5 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5}/>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Gate Pass • EADI</p>
                <h2 className="text-base font-bold text-white leading-tight">Agendamento Confirmado</h2>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-wider">Emitido em</p>
              <p className="text-[11px] font-semibold text-white">
                {new Date(booking.criadoEm).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' })}
              </p>
            </div>
          </div>

          {/* Protocol box */}
          <div className="mt-4 bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Protocolo de Liberação</p>
              <p className="font-mono text-lg font-black text-white tracking-widest leading-none">{booking.protocolo}</p>
            </div>
            <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
              Ativo
            </span>
          </div>
        </div>

        {/* Ticket notch divider */}
        <div className="relative h-0 flex items-center justify-between -mt-px">
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 z-10"/>
          <div className="flex-1 border-t border-dashed border-zinc-300 mx-6"/>
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 z-10"/>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-4 space-y-4">

          {/* Primary: Data/Hora — destaque visual */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CalendarDays className="w-8 h-8 text-emerald-600 shrink-0"/>
            <div>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Data & Horário de Retirada</p>
              <p className="text-lg font-black text-emerald-800 leading-tight">
                {fmt(booking.data)} <span className="text-emerald-500">·</span> {hora}
              </p>
            </div>
          </div>

          {/* Details grid 2×2 */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            <div className="flex items-start gap-2">
              <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
              <Field label="Nº DI" value={booking.diNumero}/>
            </div>
            <div className="flex items-start gap-2">
              <Package className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5"/>
              <Field label="Container" value={booking.container} mono/>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Motorista</p>
                <p className="text-sm font-bold text-zinc-800 leading-tight">{booking.motorista.nome}</p>
                <p className="text-[10px] text-zinc-400 font-mono">CPF {booking.motorista.cpf}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Veículo</p>
                <p className="font-mono text-sm font-black text-zinc-800 tracking-wider leading-tight bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg w-fit">
                  {booking.veiculo?.placa}
                </p>
                {booking.veiculo?.modelo && (
                  <p className="text-[10px] text-zinc-400">{booking.veiculo.modelo} · {booking.veiculo.tipo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Consignatário */}
          {booking.diCliente && (
            <div className="pt-1 border-t border-zinc-100">
              <Field label="Consignatário / Cliente" value={booking.diCliente}/>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>
            <div className="text-[11px] text-amber-800 space-y-1">
              <p className="font-bold text-amber-900">Instruções para Portaria</p>
              <ul className="space-y-0.5 list-disc pl-3">
                <li>Apresentar <strong>CNH original</strong> e documentação do veículo.</li>
                <li>Tolerância de <strong>20 min</strong> após o horário agendado.</li>
                <li>EPI obrigatório: capacete, colete e calçado fechado.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-zinc-100 bg-zinc-50 rounded-b-2xl px-6 py-3 flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 py-2 px-3 rounded-lg transition-all"
          >
            <Printer className="w-3.5 h-3.5"/> Imprimir
          </button>
          <button
            onClick={() => alert('Simulação: Comprovante salvo como PDF.')}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 py-2 px-3 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5"/> PDF
          </button>
          <button
            onClick={onReset}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg transition-all shadow-sm"
          >
            <CornerDownLeft className="w-3.5 h-3.5"/> Novo Agendamento
          </button>
        </div>
      </div>

    </div>
  );
}

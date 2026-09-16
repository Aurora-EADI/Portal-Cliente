'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock, FileCheck, ArrowLeft, ChevronLeft, ChevronRight,
  User, Package, Timer, AlertCircle, CheckCircle2, CalendarDays, Truck,
} from 'lucide-react';
import { DI, Motorista, Veiculo, Agendamento, JanelaAtendimento } from '@/types/agendamento';
import { TIME_SLOTS, gerarSlotsDeJanela } from '@/lib/agendamento';
import { api } from '@/lib/api';

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

interface SchedulingStepProps {
  selectedDI: DI;
  selectedMotorista: Motorista;
  selectedVeiculo: Veiculo;
  activeBookings: Agendamento[];
  janelasAtendimento?: JanelaAtendimento[];
  selectedJanelaId?: string;
  reservaAtiva: { id: string; expiraEm: string } | null;
  onReservarSlot: (data: string, horario: string, vagasTotais: number) => Promise<void>;
  onLiberarReserva: () => Promise<void>;
  onConfirmBooking: (data: string, horario: string) => Promise<void>;
  onBack: () => void;
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_LABELS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DAY_FULL    = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

export function SchedulingStep({
  selectedDI, selectedMotorista, selectedVeiculo,
  activeBookings, janelasAtendimento = [], selectedJanelaId = 'all',
  reservaAtiva, onReservarSlot, onLiberarReserva, onConfirmBooking, onBack,
}: SchedulingStepProps) {
  const [currentYear,  setCurrentYear]  = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 1-indexed
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [slotError,    setSlotError]    = useState('');
  const [segundos,     setSegundos]     = useState(0);
  const [slotsIn,      setSlotsIn]      = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  // contagem de vagas ocupadas por slot (inclui holds de outros clientes)
  const [slotCounts,   setSlotCounts]   = useState<Record<string, number>>({});

  /* ── slots ── */
  const dynamicSlots = useMemo(() => {
    let j = janelasAtendimento;
    if (selectedJanelaId !== 'all') j = j.filter(x => x.id === selectedJanelaId);
    if (j.length) return j.flatMap(x => gerarSlotsDeJanela(x)).sort((a,b)=>a.horario.localeCompare(b.horario));
    return TIME_SLOTS.map(h => ({ horario: h, descricao: 'Agendamento Geral', vagasTotais: 2, janelaId: 'default' }));
  }, [janelasAtendimento, selectedJanelaId]);

  /* sync selectedHour when slots change */
  useEffect(() => {
    if (!selectedHour) return;
    const m = selectedHour.match(/^(\d{2}:\d{2})/);
    if (!m) { setSelectedHour(''); return; }
    const s = dynamicSlots.find(x => x.horario === m[1]);
    if (s) { const n = `${s.horario} (${s.descricao})`; if (selectedHour !== n) setSelectedHour(n); }
    else setSelectedHour('');
  }, [dynamicSlots]);

  /* countdown */
  useEffect(() => {
    if (!reservaAtiva) { setSegundos(0); return; }
    const tick = () => {
      const d = Math.max(0, Math.floor((new Date(reservaAtiva.expiraEm).getTime() - Date.now()) / 1000));
      setSegundos(d);
      if (d === 0) { onLiberarReserva(); setSelectedHour(''); setSlotError('Tempo esgotado! Selecione outro horário.'); }
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [reservaAtiva]);

  /* disponibilidade real-time ao selecionar data */
  useEffect(() => {
    if (!selectedDate || MOCK_MODE || !dynamicSlots.length) return;
    setSlotCounts({});
    Promise.all(
      dynamicSlots.map(s =>
        api.get('/agendamento/slots/disponibilidade', {
          params: { data: selectedDate, horario: `${s.horario} (${s.descricao})` },
        }).then(r => ({ horario: s.horario, ocupados: r.data.ocupados as number }))
          .catch(() => ({ horario: s.horario, ocupados: 0 }))
      )
    ).then(results => {
      const map: Record<string, number> = {};
      results.forEach(r => { map[r.horario] = r.ocupados; });
      setSlotCounts(map);
    });
  }, [selectedDate, dynamicSlots]);

  /* slots animation */
  useEffect(() => {
    setSlotsIn(false);
    if (selectedDate) { const t = setTimeout(() => setSlotsIn(true), 40); return () => clearTimeout(t); }
  }, [selectedDate]);

  /* helpers */
  const isWeekend = (y:number,m:number,d:number) => [0,6].includes(new Date(y,m-1,d).getDay());

  const localCount = useCallback((dateKey: string, s: typeof dynamicSlots[0]) => {
    const h = `${s.horario} (${s.descricao})`;
    return activeBookings.filter(b => b.data === dateKey && (b.horario === h || b.horario === s.horario)).length;
  }, [activeBookings]);

  const slotStats = useCallback((y:number,m:number,dn:number) => {
    const key = `${y}-${String(m).padStart(2,'0')}-${String(dn).padStart(2,'0')}`;
    if (!dynamicSlots.length) return { avail:0, total:0 };
    const avail = dynamicSlots.filter(s => {
      // usar contagem do servidor se disponível (inclui holds), senão fallback local
      const c = slotCounts[s.horario] ?? localCount(key, s);
      return c < s.vagasTotais;
    }).length;
    return { avail, total: dynamicSlots.length };
  }, [dynamicSlots, slotCounts, localCount]);

  const handleDateClick = (day:number) => {
    if (isWeekend(currentYear,currentMonth,day)) return;
    if (!slotStats(currentYear,currentMonth,day).avail) return;
    setSelectedDate(`${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
    setSelectedHour(''); setSlotError('');
  };

  const handleSlotClick = useCallback(async (hourAndDesc:string, total:number) => {
    if (!selectedDate) return;
    setSlotError('');
    try {
      await onReservarSlot(selectedDate, hourAndDesc, total);
      setSelectedHour(hourAndDesc);
      setShowModal(true);
    }
    catch (err:any) { setSlotError(err?.response?.data?.message ?? 'Erro ao reservar horário'); }
  }, [selectedDate, onReservarSlot]);

  const prevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y=>y-1); }
    else setCurrentMonth(m=>m-1);
    setSelectedDate(''); setSelectedHour('');
  };
  const nextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y=>y+1); }
    else setCurrentMonth(m=>m+1);
    setSelectedDate(''); setSelectedHour('');
  };

  const fmt   = (ds:string) => { const [y,m,d] = ds.split('-'); return `${d}/${m}/${y}`; };
  const dName = (ds:string) => ds ? DAY_FULL[new Date(ds+'T12:00:00').getDay()] : '';

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDay    = new Date(currentYear, currentMonth-1, 1).getDay();

  const urgent = segundos > 0 && segundos <= 60;
  const mm = String(Math.floor(segundos/60)).padStart(2,'0');
  const ss = String(segundos%60).padStart(2,'0');

  return (
    <div className="space-y-3">

      {/* ── Timer banner ── */}
      {reservaAtiva && segundos > 0 && (
        <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 border ${
          urgent ? 'bg-red-500 border-red-400' : 'bg-amber-500 border-amber-400'
        } ${urgent ? 'animate-pulse' : ''}`}>
          <div className="flex items-center gap-2 min-w-0">
            {urgent ? <AlertCircle className="w-4 h-4 text-white shrink-0"/>:<Timer className="w-4 h-4 text-white shrink-0"/>}
            <p className="text-xs font-semibold text-white truncate">
              {urgent ? 'Confirme agora — slot quase expirado!' : 'Horário reservado — confirme antes de esgotar'}
            </p>
          </div>
          <span className="font-mono text-xl font-black text-white tabular-nums shrink-0">{mm}:{ss}</span>
        </div>
      )}

      {/* ── Two-column: Calendar | Slots ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">

        {/* ── Calendar ── */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <span className="text-sm font-bold text-zinc-800">
              {MONTH_NAMES[currentMonth-1]} {currentYear}
            </span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>

          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d,i)=>(
                <div key={d} className={`text-center text-[10px] font-bold py-1 ${i===0||i===6?'text-zinc-300':'text-zinc-400'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array(firstDay).fill(null).map((_,i)=><div key={`b${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{
                const key = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const sel  = selectedDate === key;
                const wknd = isWeekend(currentYear,currentMonth,day);
                const st   = !wknd ? slotStats(currentYear,currentMonth,day) : {avail:0,total:0};
                const full = !wknd && !st.avail;

                return (
                  <div key={day} className="flex items-center justify-center py-0.5">
                    <button
                      type="button"
                      disabled={wknd||full}
                      onClick={()=>handleDateClick(day)}
                      className={`
                        relative w-9 h-9 rounded-full text-sm font-medium transition-all duration-150 select-none
                        flex flex-col items-center justify-center
                        ${wknd  ? 'text-zinc-300 cursor-default' : ''}
                        ${full  ? 'text-zinc-300 cursor-not-allowed line-through' : ''}
                        ${sel   ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-200' : ''}
                        ${!wknd&&!full&&!sel ? 'text-zinc-700 hover:bg-sky-50 hover:text-sky-700 cursor-pointer' : ''}
                      `}
                    >
                      <span className="leading-none">{day}</span>
                      {/* availability dot */}
                      {!wknd && !full && !sel && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"/>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"/>
                Dias disponíveis
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-sky-600 inline-block"/>
                <span className="text-zinc-400">Selecionado</span>
              </span>
              <span className="flex items-center gap-1.5 line-through">
                <span className="text-zinc-300">00</span>
                <span className="no-underline">Lotado</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Slots ── */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-100">
            {selectedDate ? (
              <div>
                <p className="text-xs font-bold text-zinc-800">{dName(selectedDate)}</p>
                <p className="text-[11px] text-zinc-400">{fmt(selectedDate)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-zinc-500">Horários disponíveis</p>
                <p className="text-[11px] text-zinc-400">← Selecione um dia</p>
              </div>
            )}
          </div>

          {/* Slot list */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-1.5"
            style={{
              maxHeight: 340,
              opacity: slotsIn ? 1 : 0,
              transform: slotsIn ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              pointerEvents: selectedDate ? 'auto' : 'none',
            }}
          >
            {slotError && (
              <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <span>⚠</span>{slotError}
              </div>
            )}

            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                <Clock className="w-8 h-8 text-zinc-200"/>
                <p className="text-xs text-zinc-400">Selecione uma data no calendário</p>
              </div>
            ) : !dynamicSlots.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-center gap-1">
                <Clock className="w-6 h-6 text-zinc-200"/>
                <p className="text-xs text-zinc-400">Sem horários configurados</p>
              </div>
            ) : (
              dynamicSlots.map(slot => {
                const hd    = `${slot.horario} (${slot.descricao})`;
                const count = slotCounts[slot.horario] ?? localCount(selectedDate, slot);
                const full  = count >= slot.vagasTotais;
                const chose = selectedHour === hd;
                const left  = Math.max(0, slot.vagasTotais - count);

                return (
                  <button
                    key={hd}
                    type="button"
                    disabled={full}
                    onClick={()=>handleSlotClick(hd, slot.vagasTotais)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left
                      transition-all duration-150
                      ${full  ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed' : ''}
                      ${chose ? 'border-[#ED6A23] bg-[#ED6A23] text-white shadow-sm' : ''}
                      ${!full&&!chose ? 'border-zinc-200 bg-white text-zinc-700 hover:border-sky-300 hover:bg-sky-50 active:scale-[0.98]' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      {chose
                        ? <CheckCircle2 className="w-4 h-4 text-white shrink-0"/>
                        : <Clock className={`w-3.5 h-3.5 shrink-0 ${full ? 'text-zinc-300' : 'text-zinc-400'}`}/>
                      }
                      <span className={`font-mono font-bold text-sm tabular-nums ${chose?'text-white':full?'text-zinc-300':'text-zinc-800'}`}>
                        {slot.horario}
                      </span>
                      {slot.descricao !== 'Agendamento Geral' && (
                        <span className={`text-[10px] ${chose?'text-orange-100':full?'text-zinc-300':'text-zinc-400'}`}>
                          {slot.descricao}
                        </span>
                      )}
                    </div>
                    {full ? (
                      <span className="text-[9px] font-bold uppercase text-zinc-300 tracking-wide">Lotado</span>
                    ) : chose ? (
                      <span className="text-[10px] font-bold text-orange-100">Reservado</span>
                    ) : (
                      <span className={`text-[10px] font-semibold ${left===1?'text-amber-500':'text-emerald-500'}`}>
                        {left}/{slot.vagasTotais} vagas
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Back button */}
      <button type="button" onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
        <ArrowLeft className="w-3 h-3"/> Voltar ao Motorista
      </button>

      {/* ── Confirmation modal ── */}
      {showModal && selectedDate && selectedHour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            style={{ animation: 'modalIn 0.18s ease' }}
          >
            {/* Header */}
            <div className="bg-emerald-600 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white"/>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Confirmar agendamento</p>
                  <p className="text-sm font-bold text-white leading-tight">Tudo certo com os dados?</p>
                </div>
              </div>
            </div>

            {/* Date highlight */}
            <div className="mx-5 -mt-3 bg-white border border-zinc-200 rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
              <CalendarDays className="w-7 h-7 text-emerald-600 shrink-0"/>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Data & Horário</p>
                <p className="text-base font-black text-zinc-800 leading-tight">
                  {fmt(selectedDate)} <span className="text-zinc-400">·</span>{' '}
                  <span className="font-mono">{selectedHour.split(' ')[0]}</span>
                </p>
                <p className="text-[10px] text-zinc-400">{dName(selectedDate)}</p>
              </div>
            </div>

            {/* Details */}
            <div className="px-5 pt-4 pb-3 space-y-3">
              <div className="flex items-start gap-2.5">
                <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">DI / Container</p>
                  <p className="text-xs font-bold text-zinc-800">{selectedDI.numeroDI}</p>
                  <p className="text-[10px] font-mono text-zinc-500">{selectedDI.container}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Motorista</p>
                  <p className="text-xs font-bold text-zinc-800">{selectedMotorista.nome}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">CPF {selectedMotorista.cpf}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Veículo</p>
                  <p className="font-mono text-xs font-black text-zinc-800 tracking-wider bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-lg w-fit">
                    {selectedVeiculo.placa}
                  </p>
                  {selectedVeiculo.modelo && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">{selectedVeiculo.modelo} · {selectedVeiculo.tipo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timer reminder */}
            {reservaAtiva && segundos > 0 && (
              <div className={`mx-5 mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold ${
                urgent ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <Timer className="w-3.5 h-3.5 shrink-0"/>
                Slot reservado por <span className="font-mono font-black ml-1">{mm}:{ss}</span>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 py-2.5 rounded-xl transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => { setShowModal(false); await onConfirmBooking(selectedDate, selectedHour); }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm"
              >
                <FileCheck className="w-4 h-4"/> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

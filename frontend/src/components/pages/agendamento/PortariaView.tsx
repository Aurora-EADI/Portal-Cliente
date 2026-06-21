'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAgendamento } from '@/context/AgendamentoContext';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { StatusBadge, getStatusLabel } from './StatusBadge';
import { Agendamento } from '@/types/agendamento';

const MONTH_SHORT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const MONTH_LONG  = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const DAY_HEADERS = ['do','2ª','3ª','4ª','5ª','6ª','sá'];

const STATUS_KEYS = ['ATIVO','AG_CHEGADA','CHEGOU','ON_TIME','ATRASADO','NO_SHOW','CONCLUIDO','CANCELADO'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export function PortariaView() {
  const router = useRouter();
  const { visibleBookings } = useAgendamento();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(today);
  const [cm, setCm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [busca, setBusca] = useState('');
  const [filterHorario, setFilterHorario] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOperacao, setFilterOperacao] = useState('');

  const prevMonth = () => setCm(({ y, m }) => { const d = new Date(y, m - 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const nextMonth = () => setCm(({ y, m }) => { const d = new Date(y, m + 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const selectedStr = toDateStr(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  const filteredBookings = useMemo(() => {
    return visibleBookings.filter(bk => {
      if (bk.data !== selectedStr) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const match = [bk.motorista?.nome, bk.veiculo?.placa, bk.diCliente, bk.container, bk.transportadora]
          .some(v => v?.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filterHorario && bk.horario.split(' ')[0] !== filterHorario) return false;
      if (filterStatus && bk.status !== filterStatus) return false;
      if (filterOperacao && bk.operacao?.toLowerCase() !== filterOperacao) return false;
      return true;
    });
  }, [visibleBookings, selectedStr, busca, filterHorario, filterStatus, filterOperacao]);

  const grouped = useMemo(() => {
    const g: Record<string, Agendamento[]> = {};
    filteredBookings.forEach(bk => {
      const h = bk.horario.split(' ')[0];
      (g[h] ??= []).push(bk);
    });
    return g;
  }, [filteredBookings]);

  const uniqueHorarios = useMemo(() =>
    [...new Set(visibleBookings.filter(b => b.data === selectedStr).map(b => b.horario.split(' ')[0]))].sort(),
  [visibleBookings, selectedStr]);

  const totalDays = daysInMonth(cm.y, cm.m);
  const offset    = firstWeekday(cm.y, cm.m);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) => d === today.getDate() && cm.m === today.getMonth() && cm.y === today.getFullYear();
  const isSel   = (d: number) => d === selectedDate.getDate() && cm.m === selectedDate.getMonth() && cm.y === selectedDate.getFullYear();

  const formattedDate = `${selectedDate.getDate()} de ${MONTH_LONG[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;

  return (
    <div className="flex border border-zinc-200 rounded-xl overflow-hidden min-h-[560px] relative bg-white animate-in fade-in">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col gap-4 p-4 overflow-y-auto">
        <p className="font-bold text-zinc-900 text-sm leading-tight">{formattedDate}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
            {MONTH_SHORT[cm.m]} {cm.y}
          </span>
          <div className="flex gap-0.5">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-zinc-100 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-zinc-100 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {DAY_HEADERS.map(h => (
            <div key={h} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{h}</div>
          ))}
          {cells.map((day, i) => (
            <button
              key={i}
              disabled={!day}
              onClick={() => day && setSelectedDate(new Date(cm.y, cm.m, day))}
              className={[
                'mx-auto w-7 h-7 flex items-center justify-center rounded-full text-xs transition-colors',
                !day ? 'invisible pointer-events-none' : '',
                day && isToday(day) ? 'bg-emerald-500 text-white font-bold' : '',
                day && isSel(day) && !isToday(day) ? 'bg-zinc-200 text-zinc-900 font-semibold' : '',
                day && !isToday(day) && !isSel(day) ? 'text-zinc-700 hover:bg-zinc-100' : '',
              ].join(' ')}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <Input placeholder="Buscar" value={busca} onChange={e => setBusca(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <Select value={filterHorario} onValueChange={setFilterHorario}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Horário" /></SelectTrigger>
          <SelectContent>
            {uniqueHorarios.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_KEYS.map(k => (
              <SelectItem key={k} value={k} className="text-xs">{getStatusLabel(k)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterOperacao} onValueChange={setFilterOperacao}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Operação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="importação" className="text-xs">Importação</SelectItem>
            <SelectItem value="exportação" className="text-xs">Exportação</SelectItem>
            <SelectItem value="cabotagem"  className="text-xs">Cabotagem</SelectItem>
            <SelectItem value="nacional"   className="text-xs">Nacional</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={() => { setBusca(''); setFilterHorario(''); setFilterStatus(''); setFilterOperacao(''); }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Limpar Filtros
        </button>
      </aside>

      {/* Table */}
      <main className="flex-1 overflow-auto">
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
            <Search className="w-8 h-8 text-zinc-200" />
            <p className="text-sm">Nenhum agendamento para este dia.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-zinc-100">
                {['Horário','Status','Transportadora','Empresa','Motorista','Placa','Veículo','Operação','Observações'].map(col => (
                  <th key={col} className="text-left py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {Object.entries(grouped).sort().flatMap(([horario, bks]) =>
                bks.map((bk, idx) => (
                  <tr key={bk.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {idx === 0 ? (
                        <div className="flex items-center gap-1.5">
                          {bks.length > 1 && (
                            <span className="w-5 h-5 bg-zinc-200 rounded-full text-[10px] font-bold text-zinc-700 flex items-center justify-center shrink-0">
                              {bks.length}
                            </span>
                          )}
                          <span className="font-medium text-zinc-700">{horario}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={bk.status} /></td>
                    <td className="py-3 px-4 max-w-[160px] truncate text-zinc-700 whitespace-nowrap">{bk.transportadora ?? bk.diCliente ?? '—'}</td>
                    <td className="py-3 px-4 max-w-[180px] truncate text-zinc-700 whitespace-nowrap">{bk.empresa ?? bk.diCliente ?? '—'}</td>
                    <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">{bk.motorista?.nome || '—'}</td>
                    <td className="py-3 px-4 font-mono text-zinc-700 whitespace-nowrap">{bk.veiculo?.placa || '—'}</td>
                    <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">{bk.veiculo?.tipo ?? bk.veiculo?.modelo ?? '—'}</td>
                    <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{bk.operacao ?? '—'}</td>
                    <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{bk.observacao ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => router.push('/agendamento?tab=wizard')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-20"
        title="Novo agendamento"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Container, CalendarDays } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';

export function DIDirectoryView() {
  const router = useRouter();
  const { visibleDis, visibleBookings, activeBookings, selectedClient, setSelectedDI, setCurrentStep } = useAgendamento();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const clientDis = visibleDis;
  const filteredDIs = clientDis.filter(d => {
    const matchesSearch =
      d.numeroDI.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.container.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mercadoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDIActiveBooking = (diId: string) => visibleBookings.find(b => b.diId === diId);

  const handleStartBooking = (di: typeof visibleDis[0]) => {
    setSelectedDI(di);
    setCurrentStep(2);
    router.push('/agendamento?tab=wizard');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Siscomex Integrado</span>
          </div>
          <h2 className="text-base font-extrabold text-zinc-900">Declarações de Importação (DIs) & Containers</h2>
          <p className="text-xs text-zinc-500 mt-1">Seus equipamentos FCL vinculados e status de desembaraço</p>
        </div>
        <span className="text-sm font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-lg font-mono shrink-0">
          {filteredDIs.length} DIs
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nº DI, container ou mercadoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 border border-zinc-200 rounded-lg text-sm bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shrink-0"
        >
          <option value="all">Todos os status</option>
          <option value="liberada">Liberadas</option>
          <option value="bloqueada">Bloqueadas</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {filteredDIs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-2">
            <Container className="w-10 h-10 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-600">Nenhum container encontrado</p>
            <p className="text-xs text-zinc-400">Ajuste os filtros de busca</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {['Nº DI', 'Container / Tipo', 'Mercadoria', 'Peso Bruto', 'Status', 'Ação'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredDIs.map(di => {
                  const activeBooking = getDIActiveBooking(di.id);
                  const canBook = di.status === 'liberada' && !activeBooking;
                  return (
                    <tr key={di.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-zinc-800">{di.numeroDI}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-sky-800">{di.container}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{di.tipoContainer}</p>
                      </td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <p className="text-zinc-700 font-medium truncate">{di.mercadoria}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-zinc-600">{di.pesoBruto.toLocaleString('pt-BR')} kg</span>
                      </td>
                      <td className="py-3 px-4">
                        {activeBooking ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Agendado</span>
                        ) : di.status === 'liberada' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Liberado</span>
                        ) : (
                          <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Retido Receita</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {canBook && (
                          <button
                            onClick={() => handleStartBooking(di)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Agendar Retirada</span>
                          </button>
                        )}
                        {activeBooking && (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {activeBooking.data.split('-').reverse().join('/')} às {activeBooking.horario.split(' ')[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

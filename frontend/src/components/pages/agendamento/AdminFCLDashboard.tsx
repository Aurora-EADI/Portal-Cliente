'use client';

import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { Input } from '@/components/ui/input';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';

export function AdminAgendamentoDashboard() {
  const { activeBookings } = useAgendamento();
  const [activeTab, setActiveTab] = useState<'agendamento' | 'patio'>('agendamento');
  const [periodo, setPeriodo] = useState('');
  const [operacao, setOperacao] = useState('');
  const [transportadora, setTransportadora] = useState('');

  const stats = useMemo(() => {
    const total = activeBookings.length;
    const chegou = activeBookings.filter(b => b.status === 'CHEGOU').length;
    const noShow = activeBookings.filter(b => b.status === 'NO_SHOW').length;
    const onTime = activeBookings.filter(b => b.status === 'ON_TIME').length;
    const atrasado = activeBookings.filter(b => b.status === 'ATRASADO').length;
    const taxaShow = total > 0 ? ((chegou / total) * 100).toFixed(2) : '0.00';
    const taxaNoShow = total > 0 ? ((noShow / total) * 100).toFixed(2) : '0.00';
    return { total, chegou, noShow, onTime, atrasado, taxaShow, taxaNoShow };
  }, [activeBookings]);

  return (
    <div className="animate-in fade-in space-y-0">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200 bg-white">
        {[
          { key: 'agendamento', label: 'Dashboard Agendamento' },
          { key: 'patio', label: 'Dashboard Gestão de Pátio' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'agendamento' | 'patio')}
            className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-emerald-600 border-emerald-500'
                : 'text-zinc-500 border-transparent hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'agendamento' && (
        <div className="pt-6 space-y-5">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Input
                type="date"
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
                className="pl-3 pr-10 w-44 text-sm"
                placeholder="Período"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
            <Input
              placeholder="Operação"
              value={operacao}
              onChange={e => setOperacao(e.target.value)}
              className="w-44 text-sm"
            />
            <Select value={transportadora} onValueChange={setTransportadora}>
              <SelectTrigger className="w-52 text-sm">
                <SelectValue placeholder="Transportadora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aurora">AURORA EADI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KPI cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Nº Agendamentos', value: stats.total },
              { label: 'Chegou',          value: stats.chegou },
              { label: 'No-show',         value: stats.noShow },
              { label: 'On-time',         value: stats.onTime },
              { label: 'Atrasado',        value: stats.atrasado },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                <p className="text-sm text-zinc-500 mb-3">{label}</p>
                <p className="text-4xl font-bold text-zinc-900 font-mono leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* Taxa cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            {[
              { label: 'Taxa de Show',    value: `${stats.taxaShow}%` },
              { label: 'Taxa de No-show', value: `${stats.taxaNoShow}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm h-40 flex flex-col justify-between">
                <p className="text-sm text-zinc-500">{label}</p>
                <p className="text-3xl font-bold text-zinc-900 font-mono">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'patio' && (
        <div className="pt-12 text-center text-zinc-400">
          <p className="text-sm">Dashboard Gestão de Pátio em desenvolvimento.</p>
        </div>
      )}
    </div>
  );
}

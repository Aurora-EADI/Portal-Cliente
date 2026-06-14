'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Calendar, Clock, ArrowRight, CheckCircle,
  AlertCircle, Users, BarChart3, TrendingUp, Package,
} from 'lucide-react';
import { useAgendamento, CLIENTS } from '@/context/AgendamentoContext';

export function AdminAgendamentoDashboard() {
  const router = useRouter();
  const { dis, activeBookings, setSelectedClient } = useAgendamento();

  // Aggregate stats per client
  const clientStats = useMemo(() => {
    return CLIENTS.map((nome) => {
      const clientDis = dis.filter(d => d.cliente === nome);
      const clientBookings = activeBookings.filter(b => b.diCliente === nome);
      return {
        nome,
        totalDIs: clientDis.length,
        liberadas: clientDis.filter(d => d.status === 'liberada').length,
        bloqueadas: clientDis.filter(d => d.status === 'bloqueada').length,
        agendamentos: clientBookings.length,
        proximoAgendamento: clientBookings.sort((a, b) => a.data.localeCompare(b.data))[0] ?? null,
      };
    }).filter(c => c.totalDIs > 0 || c.agendamentos > 0);
  }, [dis, activeBookings]);

  const totals = useMemo(() => ({
    clientes: clientStats.length,
    dis: dis.length,
    liberadas: dis.filter(d => d.status === 'liberada').length,
    bloqueadas: dis.filter(d => d.status === 'bloqueada').length,
    agendamentos: activeBookings.length,
  }), [dis, activeBookings, clientStats]);

  // Recent bookings across all clients (last 5)
  const recentBookings = [...activeBookings]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 5);

  const formatDate = (ds: string) => ds.split('-').reverse().join('/');

  return (
    <div className="space-y-6 animate-in fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Painel Operacional FCL</h1>
          <p className="text-sm text-zinc-500 mt-1">Visão geral de todos os clientes e operações ativas</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Clientes Ativos', value: totals.clientes, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Total de DIs', value: totals.dis, icon: Package, color: 'text-zinc-700', bg: 'bg-zinc-50' },
          { label: 'Containers Liberados', value: totals.liberadas, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Retidos Receita', value: totals.bloqueadas, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Agendamentos Ativos', value: totals.agendamentos, icon: Calendar, color: 'text-[#ED6A23]', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`${bg} p-2.5 rounded-xl shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-zinc-900 font-mono leading-none">{value}</p>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-1 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Clients table + Recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Clients table */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-600" />
              Situação por Cliente
            </h2>
            <span className="text-[10px] text-zinc-400 font-mono">{clientStats.length} cliente(s) com dados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="text-left py-3 px-5 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Cliente</th>
                  <th className="text-center py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">DIs</th>
                  <th className="text-center py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Liberadas</th>
                  <th className="text-center py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Retidas</th>
                  <th className="text-center py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Agendamentos</th>
                  <th className="text-right py-3 px-5 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {clientStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-zinc-200" />
                      Nenhum cliente com dados no momento
                    </td>
                  </tr>
                ) : clientStats.map((client) => (
                  <tr key={client.nome} className="hover:bg-zinc-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="font-semibold text-zinc-800 truncate max-w-[220px]">{client.nome}</p>
                        {client.proximoAgendamento && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Próximo: {formatDate(client.proximoAgendamento.data)} • {client.proximoAgendamento.horario.split(' ')[0]}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-zinc-700">{client.totalDIs}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-50 text-emerald-700 font-bold rounded-lg font-mono text-xs">
                        {client.liberadas}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {client.bloqueadas > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-50 text-amber-700 font-bold rounded-lg font-mono text-xs">
                          {client.bloqueadas}
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {client.agendamentos > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#ED6A23]/10 text-[#ED6A23] font-bold rounded-lg font-mono text-xs">
                          {client.agendamentos}
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedClient(client.nome);
                          router.push('/agendamento?tab=dis');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        Ver DIs <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: recent bookings + quick actions */}
        <div className="lg:col-span-4 space-y-4">

          {/* Recent bookings */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100">
              <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ED6A23]" />
                Últimos Agendamentos
              </h2>
              <button
                onClick={() => router.push('/agendamento?tab=gate')}
                className="text-[10px] font-semibold text-primary-600 hover:underline"
              >
                Ver todos
              </button>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentBookings.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  <Calendar className="w-6 h-6 mx-auto mb-1 text-zinc-200" />
                  Nenhum agendamento ativo
                </div>
              ) : recentBookings.map((bk) => (
                <div key={bk.id} className="px-4 py-3 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-mono font-bold text-sky-900 text-xs truncate">{bk.container}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                          bk.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>{bk.status === 'ATIVO' ? 'Confirmado' : 'Cancelado'}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{bk.diCliente.split(' ')[0]} {bk.diCliente.split(' ')[1]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-emerald-700 text-[11px]">{formatDate(bk.data)}</p>
                      <p className="text-[10px] text-zinc-400">{bk.horario.split(' ')[0]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats widget */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary-100 mb-3">Resumo Operacional</p>
            <div className="space-y-2.5">
              {[
                { label: 'Taxa de liberação', value: totals.dis > 0 ? `${Math.round((totals.liberadas / totals.dis) * 100)}%` : '—', sub: `${totals.liberadas} de ${totals.dis} DIs` },
                { label: 'Agendamentos / DIs liberadas', value: totals.liberadas > 0 ? `${Math.round((totals.agendamentos / totals.liberadas) * 100)}%` : '—', sub: `${totals.agendamentos} agendado(s)` },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-[10px] text-primary-100 font-medium">{label}</p>
                    <p className="text-[10px] text-primary-200 mt-0.5">{sub}</p>
                  </div>
                  <span className="text-lg font-extrabold font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

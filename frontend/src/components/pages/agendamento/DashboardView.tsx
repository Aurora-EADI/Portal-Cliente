'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Container, Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { useAgendamento, CLIENTS } from '@/context/AgendamentoContext';
import { AdminAgendamentoDashboard } from './AdminFCLDashboard';

export function DashboardView() {
  const router = useRouter();
  const { dis, activeBookings, visibleDis, visibleBookings, selectedClient, setSelectedClient, isAdmin } = useAgendamento();

  // Admin vê o painel completo com overview de todos os clientes
  if (isAdmin) {
    return <AdminAgendamentoDashboard />;
  }

  // Cliente vê apenas os seus dados
  const totLiberadas = visibleDis.filter(d => d.status === 'liberada').length;
  const totBloqueadas = visibleDis.filter(d => d.status === 'bloqueada').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome banner */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Acesso Autorizado
            </span>
            <span className="text-zinc-400 text-xs font-mono">• Siscomex Online</span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-zinc-900 tracking-tight">{selectedClient}</h2>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-2xl">
            Módulo de agendamento FCL. Visualize seus containers desembaraçados, credencie condutores e agende docas para movimentação de saída.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => router.push('/agendamento?tab=wizard')}
            className="bg-[#ED6A23] hover:bg-[#D45917] text-white font-bold text-xs px-5 py-3 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span>Novo Agendamento</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200/95 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Agendamentos Ativos</span>
            <span className="text-2xl font-extrabold text-zinc-950 font-mono">{visibleBookings.length}</span>
            <span className="text-[10px] text-emerald-600 font-medium block">Suas reservas ativas</span>
          </div>
          <div className="bg-orange-50 text-[#ED6A23] p-3 rounded-xl"><Calendar className="w-5 h-5" /></div>
        </div>
        <div className="bg-white border border-zinc-200/95 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Containers Liberados</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">{totLiberadas}</span>
            <span className="text-[10px] text-zinc-500 block">Prontos para retirada</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl"><Container className="w-5 h-5" /></div>
        </div>
        <div className="bg-white border border-zinc-200/95 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Pendente Desembaraço</span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono">{totBloqueadas}</span>
            <span className="text-[10px] text-zinc-500 block">Aguardando Receita Federal</span>
          </div>
          <div className="bg-amber-50 text-amber-700 p-3 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* DIs list */}
        <div className="md:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Seus Equipamentos FCL</span>
            </h3>
            <button
              onClick={() => router.push('/agendamento?tab=dis')}
              className="text-[10px] text-primary-600 hover:underline font-semibold"
            >
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-zinc-100">
            {visibleDis.slice(0, 5).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <p className="font-mono font-bold text-sky-900">{item.container}</p>
                  <p className="text-[10px] text-zinc-500">DI: {item.numeroDI} • {item.tipoContainer}</p>
                </div>
                <div>
                  {item.status === 'liberada' ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Desembaraçado</span>
                  ) : (
                    <span className="bg-amber-50 text-amber-750 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Retido Receita</span>
                  )}
                </div>
              </div>
            ))}
            {visibleDis.length === 0 && (
              <p className="text-zinc-400 py-6 text-center text-xs">Nenhum container localizado.</p>
            )}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="md:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#ED6A23]" />
              <span>Janelas de Saída Programadas</span>
            </h3>
            {visibleBookings.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {visibleBookings.slice(0, 3).map((bk) => {
                  return (
                    <div key={bk.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold font-mono text-zinc-850 truncate">{bk.container}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Condutor: {bk.motorista.nome.split(' ')[0]} • {bk.veiculo.placa}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-sky-850">{bk.horario.split(' ')[0]}</p>
                        <p className="text-[10px] text-zinc-500 font-semibold">{bk.data.split('-').reverse().join('/')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400 flex flex-col items-center">
                <FileText className="w-6 h-6 text-zinc-300 mb-1" />
                <p className="text-xs">Não há saídas agendadas.</p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-zinc-150 flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 italic">Manaus Local UTC-4</span>
            <button
              onClick={() => router.push('/agendamento?tab=gate')}
              className="text-[#ED6A23] hover:text-[#D45917] hover:underline text-xs font-bold flex items-center gap-1"
            >
              <span>Gerenciar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

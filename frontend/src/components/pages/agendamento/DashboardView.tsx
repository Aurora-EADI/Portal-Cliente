'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Search, Calendar, CheckCircle, Clock, XCircle, Loader2, Printer, Download, X, Trash2, AlertTriangle, Truck } from 'lucide-react';
import Image from 'next/image';
import { useAgendamento } from '@/context/AgendamentoContext';
import { api } from '@/lib/api';
import { AdminAgendamentoDashboard } from './AdminFCLDashboard';
import { StatusBadge } from './StatusBadge';
import { Agendamento } from '@/types/agendamento';

interface AtribuicaoResumo {
  nLote: string;
  container: string;
  transportadora: { nome: string };
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-zinc-800 font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function VoucherModal({ booking, onClose }: { booking: Agendamento; onClose: () => void }) {
  const voucherRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const el = voucherRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const origWidth = el.style.width;
      el.style.width = '800px';
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', width: 800 });
      el.style.width = origWidth;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, imgHeight);
      pdf.save(`agendamento-${booking.protocolo}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const awb = booking.awbMawb ? (Array.isArray(booking.awbMawb) ? booking.awbMawb.join(', ') : booking.awbMawb) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl animate-in fade-in" onClick={e => e.stopPropagation()}>
        {/* Voucher */}
        <div ref={voucherRef} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xl">
          <div className="px-8 py-5 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo-aurora.png" alt="Aurora" width={130} height={44} className="object-contain" />
              <div className="h-10 w-px bg-zinc-200" />
              <div>
                <p className="text-zinc-900 text-sm font-bold">Comprovante de Agendamento</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">Portal do Cliente</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#ED6A23] font-mono text-sm font-bold">{booking.protocolo}</p>
              <p className="text-zinc-400 text-[11px]">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Agendamento confirmado</p>
              <p className="text-[11px] text-emerald-600">Registrado com sucesso no sistema.</p>
            </div>
          </div>

          <div className="px-8 py-6 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
            {(booking.diNumero || booking.di) && <InfoItem label="D.I" value={Array.isArray(booking.di) ? booking.di.join(', ') : (booking.diNumero || booking.di || '—')} mono />}
            {booking.container && <InfoItem label="Container" value={booking.container} mono />}
            <InfoItem label="Data" value={formatDate(booking.data)} />
            <InfoItem label="Horário" value={booking.horario} />
            <InfoItem label="Operação" value={booking.operacao ?? '—'} />
            {booking.subOperacao && <InfoItem label="SubOperação" value={booking.subOperacao} />}
            <InfoItem label="Motorista" value={booking.motorista?.nome || '—'} />
            <InfoItem label="CPF" value={booking.motorista?.cpf || '—'} mono />
            <InfoItem label="Placa" value={booking.veiculo?.placa || '—'} mono />
            <InfoItem label="Veículo" value={booking.veiculo?.tipo || booking.veiculo?.modelo || '—'} />
            <InfoItem label="Transportadora" value={booking.transportadora ?? '—'} />
            <InfoItem label="Empresa" value={booking.empresa ?? '—'} />
            {awb && <InfoItem label="AWB / MAWB" value={awb} mono />}
            {booking.consignatario && <InfoItem label="Consignatário" value={booking.consignatario} />}
          </div>

          {booking.observacao && (
            <div className="mx-8 mb-6 pt-4 border-t border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Observações</p>
              <p className="text-xs text-zinc-600">{booking.observacao}</p>
            </div>
          )}

          <div className="px-8 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-[10px] text-zinc-400">Aurora EADI — Terminal de Cargas</p>
            <p className="text-[10px] text-zinc-400 font-mono">{booking.protocolo}</p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar PDF
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  const router = useRouter();
  const { visibleBookings, visibleDis, selectedClient, isAdmin, isDespachante, isTransportadora, isLoadingData, handleCancelBooking } = useAgendamento();
  const [busca, setBusca] = useState('');
  const [viewingBooking, setViewingBooking] = useState<Agendamento | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Agendamento | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [atribuicoesPorLote, setAtribuicoesPorLote] = useState<Record<string, AtribuicaoResumo[]>>({});

  useEffect(() => {
    if (isTransportadora) return;
    api.get<AtribuicaoResumo[]>('/agendamento/atribuicoes')
      .then(({ data }) => {
        const map: Record<string, AtribuicaoResumo[]> = {};
        data.forEach(a => { (map[a.nLote] = map[a.nLote] ?? []).push(a); });
        setAtribuicoesPorLote(map);
      })
      .catch(() => {});
  }, [isTransportadora]);

  if (isAdmin) return <AdminAgendamentoDashboard />;

  const stats = useMemo(() => ({
    total:     visibleBookings.length,
    chegou:    visibleBookings.filter(b => b.status === 'CHEGOU').length,
    agChegada: visibleBookings.filter(b => b.status === 'AG_CHEGADA' || b.status === 'ATIVO').length,
    noShow:    visibleBookings.filter(b => b.status === 'NO_SHOW').length,
  }), [visibleBookings]);

  const bookedKeys = useMemo(() => {
    const keys = new Set<string>();
    visibleBookings.forEach(b => {
      const di = b.diNumero || (Array.isArray(b.di) ? b.di[0] : b.di) || '';
      const ctnr = b.container || '';
      if (di) {
        keys.add(`${di}::${ctnr}`);
        keys.add(di);
      }
      if (b.diId) keys.add(b.diId);
    });
    return keys;
  }, [visibleBookings]);

  const despachantePorDi = useMemo(() => {
    const map: Record<string, string> = {};
    visibleDis.forEach(d => { if (d.numeroDI && d.despachante) map[d.numeroDI] = d.despachante; });
    return map;
  }, [visibleDis]);

  const pendingRows = useMemo(() => {
    const rows: { di: typeof visibleDis[0]; container: string; key: string }[] = [];
    visibleDis.forEach(d => {
      if (d.status !== 'liberada') return;
      const containers = d.container ? d.container.split('/').map(c => c.trim()).filter(Boolean) : [''];
      containers.forEach(ctnr => {
        const key = `${d.numeroDI}::${ctnr}`;
        if (!bookedKeys.has(key)) {
          rows.push({ di: d, container: ctnr, key });
        }
      });
    });
    return rows.sort((a, b) => (a.di.cliente || '').localeCompare(b.di.cliente || ''));
  }, [visibleDis, bookedKeys]);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return [...visibleBookings].sort((a, b) => b.data.localeCompare(a.data));
    return visibleBookings
      .filter(b =>
        b.motorista?.nome?.toLowerCase().includes(q) ||
        b.veiculo?.placa?.toLowerCase().includes(q) ||
        b.protocolo?.toLowerCase().includes(q) ||
        b.operacao?.toLowerCase().includes(q) ||
        b.diNumero?.toLowerCase().includes(q) ||
        b.container?.toLowerCase().includes(q)
      )
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [visibleBookings, busca]);

  return (
    <>
    {viewingBooking && <VoucherModal booking={viewingBooking} onClose={() => setViewingBooking(null)} />}
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">{selectedClient}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Painel de acompanhamento de agendamentos</p>
        </div>
        <button
          onClick={() => router.push('/agendamento?tab=wizard')}
          className="inline-flex items-center gap-1.5 bg-[#ED6A23] hover:bg-[#D45917] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Agendamento
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Total</p>
            <p className="text-3xl font-bold text-zinc-900 font-mono leading-none">{stats.total}</p>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg"><Calendar className="w-5 h-5 text-blue-500" /></div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Chegou</p>
            <p className="text-3xl font-bold text-teal-600 font-mono leading-none">{stats.chegou}</p>
          </div>
          <div className="bg-teal-50 p-2.5 rounded-lg"><CheckCircle className="w-5 h-5 text-teal-500" /></div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Ag. Chegada</p>
            <p className="text-3xl font-bold text-orange-500 font-mono leading-none">{stats.agChegada}</p>
          </div>
          <div className="bg-orange-50 p-2.5 rounded-lg"><Clock className="w-5 h-5 text-orange-400" /></div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-1">No-show</p>
            <p className="text-3xl font-bold text-red-500 font-mono leading-none">{stats.noShow}</p>
          </div>
          <div className="bg-red-50 p-2.5 rounded-lg"><XCircle className="w-5 h-5 text-red-400" /></div>
        </div>
      </div>

      {/* Tabela unificada — DIs disponíveis + Agendamentos */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-800">Minhas DIs e Agendamentos</h3>
            {pendingRows.length > 0 && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                {pendingRows.length} disponível{pendingRows.length !== 1 ? 'is' : ''}
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por DI, container, motorista, placa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow w-full sm:w-72"
            />
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
              <p className="text-xs text-zinc-400">Carregando...</p>
            </div>
          </div>
        ) : pendingRows.length === 0 && filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-zinc-400">Nenhuma DI ou agendamento encontrado.</p>
            <button
              onClick={() => router.push('/agendamento?tab=wizard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ED6A23] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Criar agendamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 text-left">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">DI</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Container</th>
                  {isDespachante && <th className="px-4 py-3 font-semibold whitespace-nowrap">Cliente</th>}
                  {isTransportadora && <th className="px-4 py-3 font-semibold whitespace-nowrap">Cliente / Despachante</th>}
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Data</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Horário</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Motorista</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Placa</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Protocolo</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Agendado por</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {/* DIs/Containers disponíveis (sem agendamento) */}
                {pendingRows.map(({ di, container, key }) => {
                  const atribuicoesDoLote = atribuicoesPorLote[di.nLote ?? ''] ?? [];
                  const atribuicoes = atribuicoesDoLote.filter(a => a.container === container || a.container === '');
                  return (
                  <tr key={key} className={`hover:bg-zinc-50 transition-colors ${atribuicoes.length > 0 ? 'bg-sky-50/40' : 'bg-emerald-50/30'}`}>
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-800 whitespace-nowrap">{di.numeroDI}</td>
                    <td className="px-4 py-3 font-mono text-zinc-600 whitespace-nowrap">{container || '—'}</td>
                    {isDespachante && <td className="px-4 py-3 text-zinc-700 whitespace-nowrap text-[11px]">{di.cliente || '—'}</td>}
                    {isTransportadora && (
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap text-[11px]">
                        <div className="flex flex-col">
                          <span>{di.cliente || '—'}</span>
                          {di.despachante && <span className="text-[10px] text-zinc-400">{di.despachante}</span>}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {atribuicoes.length > 0 ? (
                        <span title={`Container atribuído a: ${atribuicoes.map(a => a.transportadora.nome).join(', ')}`} className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-300">
                          <Truck className="w-3 h-3" />
                          Atribuída à {atribuicoes[0].transportadora.nome}
                          {atribuicoes.length > 1 && ` +${atribuicoes.length - 1}`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Disponível</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">—</td>
                    <td className="px-4 py-3 text-zinc-400">—</td>
                    <td className="px-4 py-3 text-zinc-400">—</td>
                    <td className="px-4 py-3 text-zinc-400">—</td>
                    <td className="px-4 py-3 text-zinc-400">—</td>
                    <td className="px-4 py-3 text-zinc-400">—</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => router.push(`/agendamento?tab=wizard&diNumero=${encodeURIComponent(di.numeroDI)}&container=${encodeURIComponent(container)}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-md transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Agendar
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {/* Agendamentos existentes */}
                {filtered.map((bk: Agendamento) => (
                  <tr key={bk.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-zinc-800 whitespace-nowrap">{bk.diNumero || bk.di || '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-600 whitespace-nowrap">{bk.container || '—'}</td>
                    {isDespachante && <td className="px-4 py-3 text-zinc-700 whitespace-nowrap text-[11px]">{bk.diCliente || bk.empresa || '—'}</td>}
                    {isTransportadora && (
                      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap text-[11px]">
                        <div className="flex flex-col">
                          <span>{bk.diCliente || bk.empresa || '—'}</span>
                          {despachantePorDi[bk.diNumero] && <span className="text-[10px] text-zinc-400">{despachantePorDi[bk.diNumero]}</span>}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={bk.status} /></td>
                    <td className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap">{formatDate(bk.data)}</td>
                    <td className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap">{bk.horario}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{bk.motorista?.nome || '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap">{bk.veiculo?.placa || '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap text-[10px]">{bk.protocolo}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {bk.criadoPorNome ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-700">{bk.criadoPorNome}</span>
                          {bk.criadoPorRole && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              bk.criadoPorRole === 'DESPACHANTE' ? 'bg-violet-50 text-violet-600 border border-violet-200'
                              : bk.criadoPorRole === 'CLIENTE' ? 'bg-sky-50 text-sky-600 border border-sky-200'
                              : 'bg-zinc-50 text-zinc-500 border border-zinc-200'
                            }`}>{bk.criadoPorRole === 'DESPACHANTE' ? 'Desp.' : bk.criadoPorRole === 'CLIENTE' ? 'Cliente' : bk.criadoPorRole}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingBooking(bk)}
                          title="Ver comprovante"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-[#ED6A23] hover:bg-orange-50 rounded-md transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {bk.status !== 'CANCELADO' && bk.status !== 'CONCLUIDO' && (
                          <button
                            onClick={() => setCancellingBooking(bk)}
                            title="Cancelar agendamento"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* Modal cancelamento */}
    {cancellingBooking && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !isCancelling && setCancellingBooking(null)}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in" onClick={e => e.stopPropagation()}>
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">Cancelar Agendamento</h3>
            <p className="text-sm text-zinc-500 mb-1">Tem certeza que deseja cancelar este agendamento?</p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mt-3 text-left space-y-1">
              <p className="text-xs text-zinc-600"><span className="font-semibold text-zinc-700">Protocolo:</span> <span className="font-mono">{cancellingBooking.protocolo}</span></p>
              {cancellingBooking.diNumero && <p className="text-xs text-zinc-600"><span className="font-semibold text-zinc-700">DI:</span> <span className="font-mono">{cancellingBooking.diNumero}</span></p>}
              <p className="text-xs text-zinc-600"><span className="font-semibold text-zinc-700">Data:</span> {formatDate(cancellingBooking.data)} às {cancellingBooking.horario}</p>
            </div>
            <p className="text-[11px] text-red-500 mt-3">Esta ação não pode ser desfeita.</p>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setCancellingBooking(null)}
              disabled={isCancelling}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              onClick={async () => {
                setIsCancelling(true);
                try {
                  await handleCancelBooking(cancellingBooking.id);
                  setCancellingBooking(null);
                } catch {
                  alert('Erro ao cancelar agendamento. Tente novamente.');
                } finally {
                  setIsCancelling(false);
                }
              }}
              disabled={isCancelling}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isCancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelando...</> : <><Trash2 className="w-4 h-4" /> Cancelar</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

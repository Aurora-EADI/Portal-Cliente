'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Container, Clock, CheckCircle, Loader2, AlertCircle, Search, X, RefreshCw } from 'lucide-react';
import { inspectionsService, type Inspection, type InspectionListParams } from '@/services/inspections/inspections.service';
import { InspecaoContainerDetail } from './InspecaoContainerDetail';
import { Pagination } from '@/components/ui/Pagination';

const POLL_INTERVAL_MS = 30_000; // 30 segundos

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-200' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border inline-block ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export function InspecaoContainerDashboard() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Summary counts
  const [counts, setCounts] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0 });

  // Ref para acessar filtros atuais dentro do interval sem re-criar o timer
  const filtersRef = useRef({ page, limit, search, statusFilter, startDate, endDate });
  useEffect(() => {
    filtersRef.current = { page, limit, search, statusFilter, startDate, endDate };
  }, [page, limit, search, statusFilter, startDate, endDate]);

  const buildParams = useCallback((overrides?: Partial<InspectionListParams>): InspectionListParams => {
    const f = filtersRef.current;
    return {
      page: f.page,
      limit: f.limit,
      search: f.search || undefined,
      status: f.statusFilter || undefined,
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      ...overrides,
    };
  }, []);

  // Busca principal (com spinner)
  const fetchData = useCallback(async (params: InspectionListParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await inspectionsService.findAll(params);
      setInspections(res.data);
      setTotal(res.pagination.total);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar inspeções.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh silencioso em background (sem spinner na tabela)
  const silentRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const params = buildParams();
      const [res, all, pending, in_progress, completed] = await Promise.all([
        inspectionsService.findAll(params),
        inspectionsService.findAll({ limit: 1 }),
        inspectionsService.findAll({ limit: 1, status: 'pending' }),
        inspectionsService.findAll({ limit: 1, status: 'in_progress' }),
        inspectionsService.findAll({ limit: 1, status: 'completed' }),
      ]);
      setInspections(res.data);
      setTotal(res.pagination.total);
      setCounts({
        total: all.pagination.total,
        pending: pending.pagination.total,
        in_progress: in_progress.pagination.total,
        completed: completed.pagination.total,
      });
      setLastUpdated(new Date());
    } catch { /* silent — não interrompe o usuário */ } finally {
      setIsRefreshing(false);
    }
  }, [buildParams]);

  const fetchCounts = useCallback(async () => {
    try {
      const [all, pending, in_progress, completed] = await Promise.all([
        inspectionsService.findAll({ limit: 1 }),
        inspectionsService.findAll({ limit: 1, status: 'pending' }),
        inspectionsService.findAll({ limit: 1, status: 'in_progress' }),
        inspectionsService.findAll({ limit: 1, status: 'completed' }),
      ]);
      setCounts({
        total: all.pagination.total,
        pending: pending.pagination.total,
        in_progress: in_progress.pagination.total,
        completed: completed.pagination.total,
      });
    } catch { /* silent */ }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchData(buildParams({ page, limit }));
  }, [page, limit]);

  // Polling automático a cada 30s
  useEffect(() => {
    const timer = setInterval(() => {
      silentRefresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [silentRefresh]);

  const handleSearch = () => {
    setPage(1);
    fetchData(buildParams({ page: 1 }));
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    fetchData({ page: 1, limit });
  };

  const handleManualRefresh = () => {
    silentRefresh();
  };

  const handleViewDetail = async (inspection: Inspection) => {
    try {
      setLoadingDetail(true);
      const full = await inspectionsService.findOne(inspection.id);
      setSelected(full);
    } catch {
      setError('Erro ao carregar detalhe da inspeção.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const hasFilters = search || statusFilter || startDate || endDate;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Vistorias</h1>
          <p className="text-gray-500 mt-1">Visualize todas as inspeções de containers realizadas pelo app mobile.</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Atualizar agora"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-400 transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, icon: Container, color: 'bg-gray-100 text-gray-600' },
          { label: 'Pendentes', value: counts.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Em Andamento', value: counts.in_progress, icon: Loader2, color: 'bg-blue-100 text-blue-600' },
          { label: 'Concluídas', value: counts.completed, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por container, motorista ou placa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Filtrar
            </button>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                title="Limpar filtros"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Período:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-xs text-gray-400">até</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : inspections.length > 0 ? (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-opacity ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-4">Container</th>
                <th className="px-5 py-4">Tipo Op.</th>
                <th className="px-5 py-4">Motorista</th>
                <th className="px-5 py-4">Inspetor</th>
                <th className="px-5 py-4">Data/Hora</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inspections.map(insp => (
                <tr key={insp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{insp.containerNumero}</div>
                    <div className="text-xs text-gray-500">{insp.containerType}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{insp.tipoOperacao}</td>
                  <td className="px-5 py-3">
                    <div className="text-gray-800">{insp.motorista}</div>
                    <div className="text-xs text-gray-500">{insp.placaCavalo}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{insp.user?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {new Date(insp.dataHora).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={insp.inspectionStatus} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleViewDetail(insp)}
                      disabled={loadingDetail}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      {loadingDetail ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Container size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhuma inspeção encontrada</h3>
          <p className="text-gray-500 mt-1">
            {hasFilters ? 'Tente ajustar os filtros aplicados.' : 'As vistorias realizadas pelo app aparecerão aqui.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      )}

      {/* Detail Panel */}
      {selected && (
        <InspecaoContainerDetail
          inspection={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
